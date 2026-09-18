import { useState, useEffect, useMemo } from "react";

const INITIAL_COUNT = 30;
const INCREMENT_STEPS = [50, 50, 100]; // مرحله‌های اول، دوم، سوم؛ از مرحله چهارم به بعد دو برابر می‌شود

/**
 * هوک نمایش تدریجی («نمایش بیشتر»):
 * ابتدا فقط ۳۰ مورد نشان می‌دهد. با هر کلیک روی «نمایش بیشتر»:
 * کلیک ۱ -> ۵۰ مورد بعدی، کلیک ۲ -> ۵۰ مورد بعدی، کلیک ۳ -> ۱۰۰ مورد بعدی،
 * و از کلیک ۴ به بعد هر بار مقدار قبلی دو برابر می‌شود، تا وقتی همه‌ی موارد نمایش داده شوند.
 */
export function useShowMore(totalLength) {
  const [clickCount, setClickCount] = useState(0);

  // اگر لیست (مثلاً به‌خاطر فیلتر یا جستجو) عوض شود، دوباره از اول شروع می‌شود
  useEffect(() => {
    setClickCount(0);
  }, [totalLength]);

  const visibleCount = useMemo(() => {
    let count = INITIAL_COUNT;
    for (let i = 0; i < clickCount; i++) {
      const step = i < INCREMENT_STEPS.length ? INCREMENT_STEPS[i] : INCREMENT_STEPS[INCREMENT_STEPS.length - 1] * Math.pow(2, i - INCREMENT_STEPS.length + 1);
      count += step;
    }
    return Math.min(count, totalLength);
  }, [clickCount, totalLength]);

  const hasMore = visibleCount < totalLength;
  const remaining = totalLength - visibleCount;

  const showMore = () => setClickCount((c) => c + 1);

  return { visibleCount, hasMore, remaining, showMore };
}
