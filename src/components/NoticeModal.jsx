import React, { useState } from "react";
import { ModalShell } from "./ModalShell";
import { Field, JalaliDateFields } from "./Shared";
import { tehranJalaliParts } from "../utils/dateUtils";

export function NoticeModal({ initial, onClose, onSubmit, onDelete }) {
  const today = tehranJalaliParts(new Date());
  const [form, setForm] = useState({
    noticeNumber: initial?.noticeNumber || "",
    amount: initial?.amount || "",
    jy: initial?.jy || today[0],
    jm: initial?.jm || today[1],
    jd: initial?.jd || today[2],
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.noticeNumber || !form.amount) return;
    onSubmit({
      ...form,
      jy: parseInt(form.jy),
      jm: parseInt(form.jm),
      jd: parseInt(form.jd),
      amount: parseInt(form.amount) || 0,
    });
  };

  return (
    <ModalShell title={initial ? "ویرایش ابلاغیه" : "اضافه کردن ابلاغیه"} onClose={onClose} onDelete={onDelete}>
      <form onSubmit={submit} className="form">
        <Field label="شماره ابلاغیه">
          <input className="input" value={form.noticeNumber} onChange={set("noticeNumber")} required />
        </Field>
        <Field label="مبلغ اعمال‌شده (تومان)">
          <input className="input" type="number" value={form.amount} onChange={set("amount")} required inputMode="numeric" />
        </Field>
        <Field label="تاریخ (شمسی)">
          <JalaliDateFields jy={form.jy} jm={form.jm} jd={form.jd} onChange={(v) => setForm((f) => ({ ...f, ...v }))} />
        </Field>
        <button type="submit" className="submit-btn">
          {initial ? "ذخیره تغییرات" : "ثبت ابلاغیه"}
        </button>
      </form>
    </ModalShell>
  );
}
