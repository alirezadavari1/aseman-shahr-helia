import React, { useState, useEffect } from "react";
import { elapsedSinceJalali, formatElapsed } from "../utils/dateUtils";
import { Icon } from "./Icons";

/**
 * نمایش زنده‌ی زمان سپری‌شده از یک تاریخ شمسی مشخص تا الان.
 * هر ثانیه خودش را به‌روزرسانی می‌کند (مثال: «۲ سال و ۳ ماه و ۱ هفته و ۳ روز و ۲ ساعت و ۴ دقیقه و ۵ ثانیه»)
 */
export function ElapsedTimer({ jy, jm, jd }) {
  const [text, setText] = useState("");

  useEffect(() => {
    const tick = () => {
      const parts = elapsedSinceJalali(jy, jm, jd);
      setText(formatElapsed(parts));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [jy, jm, jd]);

  return (
    <span className="elapsed-timer">
      <Icon.clock color="#8a6fb0" />
      {text}
    </span>
  );
}
