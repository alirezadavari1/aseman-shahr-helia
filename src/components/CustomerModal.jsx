import React, { useState } from "react";
import { ModalShell } from "./ModalShell";
import { Field, JalaliDateFields } from "./Shared";
import { formatRial, tehranJalaliParts } from "../utils/dateUtils";

export function CustomerModal({ initial, latestDeposit, totalDeposits, onClose, onSubmit }) {
  const today = tehranJalaliParts(new Date());
  const [form, setForm] = useState({
    firstName: initial?.firstName || "",
    lastName: initial?.lastName || "",
    nationalId: initial?.nationalId || "",
    phone: initial?.phone || "",
    caseNumber: initial?.caseNumber || "",
    joinJy: initial?.joinJy || today[0],
    joinJm: initial?.joinJm || today[1],
    joinJd: initial?.joinJd || today[2],
    manualDepositAdjustment: initial?.manualDepositAdjustment ?? 0,
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) return;
    onSubmit({
      ...form,
      joinJy: parseInt(form.joinJy),
      joinJm: parseInt(form.joinJm),
      joinJd: parseInt(form.joinJd),
      manualDepositAdjustment: parseInt(form.manualDepositAdjustment) || 0,
    });
  };

  return (
    <ModalShell title={initial ? "ویرایش مشتری" : "اضافه کردن مشتری"} onClose={onClose}>
      <form onSubmit={submit} className="form">
        <Field label="اسم">
          <input className="input" value={form.firstName} onChange={set("firstName")} required />
        </Field>
        <Field label="فامیلی">
          <input className="input" value={form.lastName} onChange={set("lastName")} required />
        </Field>
        <Field label="کد ملی">
          <input className="input" value={form.nationalId} onChange={set("nationalId")} inputMode="numeric" />
        </Field>
        <Field label="شماره تماس">
          <input
            className="input ltr-input"
            value={form.phone}
            onChange={(e) => {
              const v = e.target.value.replace(/[^\d]/g, "");
              setForm((f) => ({ ...f, phone: v }));
            }}
            inputMode="numeric"
            placeholder="09xxxxxxxxx"
          />
        </Field>
        <Field label="شماره پرونده">
          <input className="input" value={form.caseNumber} onChange={set("caseNumber")} />
        </Field>
        <Field label="تاریخ عضویت (شمسی)">
          <JalaliDateFields
            jy={form.joinJy}
            jm={form.joinJm}
            jd={form.joinJd}
            onChange={(v) => setForm((f) => ({ ...f, joinJy: v.jy, joinJm: v.jm, joinJd: v.jd }))}
          />
        </Field>

        {initial && (
          <Field label="تنظیم دستی مجموع واریزی (اضافه/کسر می‌شود روی مجموع واقعی)">
            <input
              className="input"
              type="number"
              value={form.manualDepositAdjustment}
              onChange={set("manualDepositAdjustment")}
              inputMode="numeric"
            />
          </Field>
        )}

        {initial && (
          <div className="preview-box">
            <div className="preview-line">
              {form.firstName} {form.lastName}
            </div>
            <div className="preview-line">پرونده: {form.caseNumber || "—"}</div>
            <div className="preview-line">
              آخرین واریزی: {latestDeposit ? formatRial(latestDeposit.amount) : "—"}
            </div>
            <div className="preview-line">مجموع واریزی: {formatRial(totalDeposits || 0)}</div>
          </div>
        )}

        <button type="submit" className="submit-btn">
          {initial ? "ذخیره تغییرات" : "ساخت مشتری"}
        </button>
      </form>
    </ModalShell>
  );
}
