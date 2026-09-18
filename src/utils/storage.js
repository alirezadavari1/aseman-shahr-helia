/* ============================================================
   ذخیره‌سازی محلی + ابزار پشتیبان‌گیری (Export/Import JSON)
   ============================================================ */

const STORAGE_KEY = "aseman-shahr-helia-v1";

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("خطا در بارگذاری اطلاعات ذخیره‌شده:", e);
  }
  return { customers: [], deposits: [], notices: [] };
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("خطا در ذخیره‌سازی اطلاعات:", e);
  }
}

/** خروجی گرفتن از اطلاعات به‌صورت فایل JSON قابل دانلود (برای بک‌آپ) */
export function exportStateToFile(state) {
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
}

/** خواندن یک فایل JSON انتخاب‌شده توسط کاربر و برگرداندن آن به‌صورت آبجکت */
export function importStateFromFile(file) {
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
