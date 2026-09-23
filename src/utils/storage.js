/* ============================================================
   ذخیره‌سازی محلی + ابزار پشتیبان‌گیری (Export/Import JSON)
   در نسخه‌ی وب: localStorage مرورگر.
   در نسخه‌ی دسکتاپ (Electron): مستقیماً یک فایل JSON روی دیسک (فایل اصلی برنامه)،
   به‌علاوه‌ی localStorage به‌عنوان یک نسخه‌ی پشتیبانِ اضافه در همان دستگاه.
   ============================================================ */

const STORAGE_KEY = "aseman-shahr-helia-v1";

export function isElectron() {
  return typeof window !== "undefined" && !!window.electronAPI?.isElectron;
}

function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("خطا در بارگذاری اطلاعات ذخیره‌شده:", e);
  }
  return { customers: [], deposits: [], notices: [] };
}

function saveToLocalStorage(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("خطا در ذخیره‌سازی اطلاعات:", e);
  }
}

/** بارگذاری همزمان (اولیه، فقط برای رندر سریع اول برنامه) — همیشه از localStorage. */
export function loadState() {
  return loadFromLocalStorage();
}

/**
 * بارگذاری «واقعی» اطلاعات: در نسخه‌ی دسکتاپ از فایل اصلی روی دیسک، در نسخه‌ی وب از localStorage.
 * اگر در دسکتاپ اجرا شده و فایل اصلی خالی بود ولی localStorage داده داشت (اولین اجرای دسکتاپ
 * بعد از استفاده از نسخه‌ی وب)، همان داده‌های قبلی را به‌عنوان مبنا برمی‌گرداند تا چیزی گم نشود.
 */
export async function loadStateAsync() {
  if (isElectron()) {
    const fromDisk = await window.electronAPI.loadData();
    const hasDiskData =
      fromDisk && (fromDisk.customers.length || fromDisk.deposits.length || fromDisk.notices.length);
    if (hasDiskData) return fromDisk;
    // فایل اصلی هنوز خالی است؛ اگر localStorage قبلاً داده‌ای داشت (مثلاً از نسخه‌ی وب) همان را برگردان
    return loadFromLocalStorage();
  }
  return loadFromLocalStorage();
}

/** ذخیره‌سازی همیشگی: در دسکتاپ روی فایل اصلی دیسک، و در هر دو حالت در localStorage به‌عنوان نسخه‌ی افزوده. */
export function saveState(state) {
  saveToLocalStorage(state);
  if (isElectron()) {
    window.electronAPI.saveData(state).catch(() => {});
  }
}

/**
 * خروجی گرفتن از اطلاعات به‌صورت فایل JSON (برای بک‌آپ).
 * در دسکتاپ: پنجره‌ی بومی «ذخیره به‌عنوان» ویندوز باز می‌شود تا کاربر بتواند
 * چند نسخه در چند مکان مختلف (فلش، درایو دیگر، پوشه‌ی ابری) نگه دارد.
 * در وب: دانلود معمولی مرورگر.
 */
export async function exportStateToFile(state) {
  if (isElectron()) {
    const result = await window.electronAPI.exportData(state);
    return result;
  }
  const dataStr = JSON.stringify(state, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const now = new Date();
  const stamp = now.toISOString().slice(0, 10);
  a.href = url;
  a.download = `aseman-shahr-helia-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return { canceled: false };
}

/**
 * خواندن یک فایل پشتیبان JSON.
 * در دسکتاپ: پنجره‌ی بومی «باز کردن فایل» ویندوز.
 * در وب: همان ورودی <input type="file"> قبلی.
 */
export async function importStateFromFile(file) {
  if (isElectron()) {
    const result = await window.electronAPI.importData();
    if (result.canceled) return null;
    if (result.error) throw new Error(result.error);
    return result.data;
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed || typeof parsed !== "object") {
          throw new Error("ساختار فایل نامعتبر است");
        }
        resolve({
          customers: Array.isArray(parsed.customers) ? parsed.customers : [],
          deposits: Array.isArray(parsed.deposits) ? parsed.deposits : [],
          notices: Array.isArray(parsed.notices) ? parsed.notices : [],
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("خطا در خواندن فایل"));
    reader.readAsText(file, "utf-8");
  });
}

/**
 * ادغام اطلاعات وارد‌شده از فایل خارجی با اطلاعات فعلی.
 * رکوردهایی که id یکسان دارند به‌روزرسانی می‌شوند و رکوردهای جدید اضافه می‌شوند.
 */
export function mergeImportedState(currentState, importedState) {
  const mergeById = (currentArr, importedArr) => {
    const map = new Map(currentArr.map((item) => [item.id, item]));
    importedArr.forEach((item) => {
      if (item && item.id) map.set(item.id, { ...map.get(item.id), ...item });
    });
    return Array.from(map.values());
  };

  return {
    customers: mergeById(currentState.customers, importedState.customers),
    deposits: mergeById(currentState.deposits, importedState.deposits),
    notices: mergeById(currentState.notices, importedState.notices),
  };
}
