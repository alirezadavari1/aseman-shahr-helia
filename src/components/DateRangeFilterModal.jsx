import React, { useState } from "react";
import { ModalShell } from "./ModalShell";
import { Field, JalaliDateFields } from "./Shared";
import { tehranJalaliParts } from "../utils/dateUtils";

export function DateRangeFilterModal({ title, initial, onClose, onApply, onReset }) {
  const today = tehranJalaliParts(new Date());
  const [from, setFrom] = useState({
    jy: initial?.fromJ?.[0] || today[0],
    jm: initial?.fromJ?.[1] || 1,
    jd: initial?.fromJ?.[2] || 1,
  });
  const [to, setTo] = useState({
    jy: initial?.toJ?.[0] || today[0],
    jm: initial?.toJ?.[1] || today[1],
    jd: initial?.toJ?.[2] || today[2],
  });

  const submit = (e) => {
    e.preventDefault();
    onApply({
      fromJ: [parseInt(from.jy), parseInt(from.jm), parseInt(from.jd)],
      toJ: [parseInt(to.jy), parseInt(to.jm), parseInt(to.jd)],
    });
  };

  return (
    <ModalShell title={title} onClose={onClose}>
      <form onSubmit={submit} className="form">
        <Field label="از تاریخ (شمسی)">
          <JalaliDateFields jy={from.jy} jm={from.jm} jd={from.jd} onChange={(v) => setFrom(v)} />
        </Field>
        <Field label="تا تاریخ (شمسی)">
          <JalaliDateFields jy={to.jy} jm={to.jm} jd={to.jd} onChange={(v) => setTo(v)} />
        </Field>
        <button type="submit" className="submit-btn">
          اعمال فیلتر
        </button>
        <button type="button" className="reset-btn" onClick={onReset}>
          نمایش همه (حذف فیلتر)
        </button>
      </form>
    </ModalShell>
  );
}
