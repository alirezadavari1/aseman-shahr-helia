const https = require("https");
const os = require("os");
const fs = require("fs");
const path = require("path");

/**
 * ماژول «زمان قابل اعتماد» — هدف: همیشه یک «الان» درست بدهد،
 * چه اینترنت باشد چه نباشد، و حتی اگر ساعت/تاریخ سیستم دستکاری یا خراب شده باشد.
 *
 * استراتژی:
 * ۱) وقتی اینترنت هست: با یک درخواست HTTPS HEAD به چند سرور معتبر، هدر Date پاسخ را
 *    می‌خوانیم (این هدر روی تمام سرورهای HTTPS استاندارد وجود دارد و به هیچ API خاصی
 *    وابسته نیست) و آن را به‌عنوان «زمان واقعی» می‌پذیریم.
 * ۲) این زمان واقعی را همراه با os.uptime() (مدت روشن‌بودن سیستم از آخرین ری‌استارت —
 *    که با تغییر دستی تاریخ/ساعت توسط کاربر خراب نمی‌شود) در یک فایل کوچک ذخیره می‌کنیم.
 * ۳) وقتی اینترنت نیست: «الان» را از روی آخرین‌بار زمان واقعیِ ذخیره‌شده + مقدار
 *    پیشرفتِ os.uptime() از آن لحظه تا الان حساب می‌کنیم (نه از روی ساعت سیستم).
 * ۴) به‌عنوان آخرین خط دفاعی، هیچ‌وقت اجازه نمی‌دهیم «الان» از آخرین زمانِ معتبرِ
 *    ثبت‌شده عقب‌تر برود؛ حتی اگر سیستم ری‌استارت شده باشد و ساعتش هم خراب باشد.
 */

const TIME_HOSTS = ["https://www.cloudflare.com", "https://www.google.com", "https://www.microsoft.com", "https://github.com"];
const FETCH_TIMEOUT_MS = 4000;

function fetchDateFromHost(host) {
  return new Promise((resolve) => {
    const req = https.request(host, { method: "HEAD", timeout: FETCH_TIMEOUT_MS }, (res) => {
      const dateHeader = res.headers && res.headers.date;
      res.resume(); // مصرف/رهاسازی پاسخ
      if (dateHeader) {
        const ms = Date.parse(dateHeader);
        resolve(Number.isFinite(ms) ? ms : null);
      } else {
        resolve(null);
      }
    });
    req.on("timeout", () => {
      req.destroy();
      resolve(null);
    });
    req.on("error", () => resolve(null));
    req.end();
  });
}

async function fetchTrustedServerTimeMs() {
  for (const host of TIME_HOSTS) {
    const ms = await fetchDateFromHost(host);
    if (ms) return ms;
  }
  return null;
}

class TrustedTime {
  constructor(userDataDir) {
    this.checkpointPath = path.join(userDataDir, "time-checkpoint.json");
    this.checkpoint = this._loadCheckpoint();
  }

  _loadCheckpoint() {
    try {
      const raw = fs.readFileSync(this.checkpointPath, "utf-8");
      const parsed = JSON.parse(raw);
      if (typeof parsed.lastGoodServerTimeMs === "number" && typeof parsed.uptimeAtSyncSeconds === "number") {
        return parsed;
      }
    } catch (e) {
      // فایل هنوز وجود ندارد یا خراب است؛ از صفر شروع می‌کنیم
    }
    return null;
  }

  _saveCheckpoint(checkpoint) {
    this.checkpoint = checkpoint;
    try {
      fs.writeFileSync(this.checkpointPath, JSON.stringify(checkpoint), "utf-8");
    } catch (e) {
      // اگر نوشتن فایل هم شکست بخورد، حداقل مقدار در حافظه برای همین اجرا باقی می‌ماند
    }
  }

  /** بهترین تخمین از «الان»، به میلی‌ثانیه، بدون اتکا به این‌که اینترنت باشد یا ساعت سیستم درست باشد. */
  async getTrustedNowMs() {
    const systemNow = Date.now();
    const currentUptime = os.uptime();

    const serverMs = await fetchTrustedServerTimeMs();
    if (serverMs) {
      // اینترنت هست: زمان واقعی را می‌گیریم و چک‌پوینت را تازه می‌کنیم
      this._saveCheckpoint({ lastGoodServerTimeMs: serverMs, uptimeAtSyncSeconds: currentUptime });
      return serverMs;
    }

    // اینترنت نیست: تلاش برای محاسبه از روی آخرین چک‌پوینت + پیشرفت uptime
    if (this.checkpoint && currentUptime >= this.checkpoint.uptimeAtSyncSeconds) {
      const elapsedSinceSyncMs = (currentUptime - this.checkpoint.uptimeAtSyncSeconds) * 1000;
      const bridged = this.checkpoint.lastGoodServerTimeMs + elapsedSinceSyncMs;
      return Math.max(bridged, systemNow > 0 ? 0 : 0, this.checkpoint.lastGoodServerTimeMs);
    }

    // سیستم ری‌استارت شده (uptime کمتر از چک‌پوینت قبلی) یا اصلاً چک‌پوینتی نداریم:
    // به ساعت سیستم برمی‌گردیم، ولی هرگز اجازه نمی‌دهیم از آخرین زمان معتبر عقب‌تر برویم
    const floor = this.checkpoint ? this.checkpoint.lastGoodServerTimeMs : 0;
    return Math.max(systemNow, floor);
  }
}

module.exports = { TrustedTime };
