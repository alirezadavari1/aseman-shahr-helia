/* ============================================================
   ابزارهای تاریخ: تبدیل میلادی <-> شمسی و محاسبات زمانی
   مستقل از تنظیمات دستی ساعت سیستم و بدون نیاز به اینترنت
   ============================================================ */

export function gregorianToJalali(gy, gm, gd) {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  gy -= gy <= 1600 ? 621 : 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) -
    80 +
    gd +
    g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return [jy, jm, jd];
}

export function jalaliToGregorian(jy, jm, jd) {
  let gy = jy <= 979 ? 621 : 1600;
  jy -= jy <= 979 ? 0 : 979;
  let days =
    365 * jy +
    Math.floor(jy / 33) * 8 +
    Math.floor(((jy % 33) + 3) / 4) +
    78 +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  gy += 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const gd0 = days + 1;
  const sal_a = [
    0, 31,
    (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28,
    31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
  ];
  let gm = 0;
  let gd = gd0;
  for (let i = 1; i <= 12; i++) {
    if (gd <= sal_a[i]) {
      gm = i;
      break;
    }
    gd -= sal_a[i];
  }
  return [gy, gm, gd];
}

export const JALALI_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

export function tehranClockFormatter() {
  return new Intl.DateTimeFormat("fa-IR", {
    timeZone: "Asia/Tehran",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function tehranJalaliParts(date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const map = {};
  parts.forEach((p) => (map[p.type] = p.value));
  return gregorianToJalali(parseInt(map.year), parseInt(map.month), parseInt(map.day));
}

export function jalaliDateObjFromParts(jy, jm, jd) {
  const [gy, gm, gd] = jalaliToGregorian(jy, jm, jd);
  // ساخته‌شده در نیمروز به‌وقت تهران تا مشکل منطقه زمانی در محاسبه فاصله روزها ایجاد نشود
  return new Date(Date.UTC(gy, gm - 1, gd, 8, 30, 0));
}

function strip(d) {
  return Date.UTC(
    d.getUTCFullYear ? d.getUTCFullYear() : d.getFullYear(),
    d.getUTCMonth ? d.getUTCMonth() : d.getMonth(),
    d.getUTCDate ? d.getUTCDate() : d.getDate()
  );
}

export function daysBetween(dateA, dateB) {
  const MS = 1000 * 60 * 60 * 24;
  return Math.floor((strip(dateB) - strip(dateA)) / MS);
}

/**
 * محاسبه‌ی امتیاز خودکار یک واریزی مشخص، نسبت به یک «تاریخ مرجع» (پیش‌فرض: همین الان).
 * طبق درخواست: همان روزی که واریزی ثبت می‌شود باید اولین امتیاز را بگیرد،
 * پس یک روز به فاصله‌ی محاسبه‌شده اضافه می‌شود (روز صفر هم حساب می‌شود).
 */
export function computeAutoPoints(amount, jy, jm, jd, referenceDate = new Date()) {
  const depDate = jalaliDateObjFromParts(jy, jm, jd);
  const daysPassed = Math.max(0, daysBetween(depDate, referenceDate)) + 1;
  const millions = Math.floor((Number(amount) || 0) / 1000000);
  return millions * daysPassed;
}

export function formatJalali(jy, jm, jd) {
  return `${jd} ${JALALI_MONTHS[jm - 1]} ${jy}`;
}

export function formatToman(n) {
  const num = Number(n) || 0;
  return num.toLocaleString("fa-IR") + " تومان";
}

/**
 * محاسبه‌ی فاصله‌ی زمانیِ دقیق (سال، ماه، هفته، روز، ساعت، دقیقه، ثانیه)
 * بین یک تاریخ شمسیِ ثبت‌شده و لحظه‌ی حال، به‌صورت زنده و خوانا.
 * مثال خروجی: «۲ سال و ۳ ماه و ۱ هفته و ۳ روز و ۲ ساعت و ۴ دقیقه و ۵ ثانیه»
 */
export function elapsedSinceJalali(jy, jm, jd, now = new Date()) {
  const start = jalaliDateObjFromParts(jy, jm, jd);
  let diffMs = now.getTime() - start.getTime();
  if (diffMs < 0) diffMs = 0;

  let totalSeconds = Math.floor(diffMs / 1000);

  const SEC_IN_MIN = 60;
  const SEC_IN_HOUR = 3600;
  const SEC_IN_DAY = 86400;
  const SEC_IN_WEEK = SEC_IN_DAY * 7;
  const SEC_IN_MONTH = SEC_IN_DAY * 30; // ماه تقریبی برای نمایش خوانا
  const SEC_IN_YEAR = SEC_IN_DAY * 365;

  const years = Math.floor(totalSeconds / SEC_IN_YEAR);
  totalSeconds -= years * SEC_IN_YEAR;

  const months = Math.floor(totalSeconds / SEC_IN_MONTH);
  totalSeconds -= months * SEC_IN_MONTH;

  const weeks = Math.floor(totalSeconds / SEC_IN_WEEK);
  totalSeconds -= weeks * SEC_IN_WEEK;

  const days = Math.floor(totalSeconds / SEC_IN_DAY);
  totalSeconds -= days * SEC_IN_DAY;

  const hours = Math.floor(totalSeconds / SEC_IN_HOUR);
  totalSeconds -= hours * SEC_IN_HOUR;

  const minutes = Math.floor(totalSeconds / SEC_IN_MIN);
  totalSeconds -= minutes * SEC_IN_MIN;

  const seconds = totalSeconds;

  return { years, months, weeks, days, hours, minutes, seconds };
}

const UNIT_LABELS = {
  years: "سال",
  months: "ماه",
  weeks: "هفته",
  days: "روز",
  hours: "ساعت",
  minutes: "دقیقه",
  seconds: "ثانیه",
};

/** تبدیل خروجی elapsedSinceJalali به یک رشته‌ی فارسی خوانا */
export function formatElapsed(parts) {
  const order = ["years", "months", "weeks", "days", "hours", "minutes", "seconds"];
  const segments = order
    .filter((key) => parts[key] > 0)
    .map((key) => `${parts[key].toLocaleString("fa-IR")} ${UNIT_LABELS[key]}`);
  if (segments.length === 0) return "همین الان";
  return segments.join(" و ");
}
