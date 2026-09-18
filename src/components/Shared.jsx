import React from "react";
import { JALALI_MONTHS } from "../utils/dateUtils";

export function Section({ title, accent, actionLabel, onAction, icon, extraActions, children }) {
  return (
    <section className="section" style={{ "--accent": accent }}>
      <div className="section-head">
        <h2 className="section-title">
          <span className="section-dot" style={{ background: accent }} />
          {title}
        </h2>
        <div className="section-head-actions">
          {extraActions}
          <button className="action-btn" style={{ background: accent }} onClick={onAction}>
            {icon}
            {actionLabel}
          </button>
        </div>
      </div>
      <div className="section-body">{children}</div>
    </section>
  );
}

export function EmptyState({ text }) {
  return <div className="empty-state">{text}</div>;
}

export function ShowMoreButton({ onClick, remaining }) {
  return (
    <button type="button" className="show-more-btn" onClick={onClick}>
      نمایش بیشتر (باقی‌مانده: {remaining.toLocaleString("fa-IR")})
    </button>
  );
}

export function Field({ label, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

export function JalaliDateFields({ jy, jm, jd, onChange }) {
  return (
    <div className="jalali-row">
      <input
        className="jalali-input"
        type="number"
        placeholder="روز"
        value={jd}
        min={1}
        max={31}
        onChange={(e) => onChange({ jy, jm, jd: e.target.value })}
      />
      <select
        className="jalali-select"
        value={jm}
        onChange={(e) => onChange({ jy, jm: e.target.value, jd })}
      >
        {JALALI_MONTHS.map((m, i) => (
          <option key={m} value={i + 1}>
            {m}
          </option>
        ))}
      </select>
      <input
        className="jalali-input"
        type="number"
        placeholder="سال"
        value={jy}
        min={1300}
        max={1500}
        onChange={(e) => onChange({ jy: e.target.value, jm, jd })}
      />
    </div>
  );
}
