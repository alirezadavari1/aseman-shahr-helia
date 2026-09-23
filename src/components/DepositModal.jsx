import React, { useState } from "react";
import { ModalShell } from "./ModalShell";
import { Field, JalaliDateFields, FormattedAmountInput } from "./Shared";
import { SearchableSelect } from "./SearchableSelect";
import { tehranJalaliParts, formatRial } from "../utils/dateUtils";

export function DepositModal({ customers, notices, initial, defaultCustomerId, onClose, onSubmit, onDelete }) {
  const today = tehranJalaliParts(new Date());
  const [form, setForm] = useState({
    customerId: initial?.customerId || defaultCustomerId || "",
    depositType: initial?.depositType || "cash",
    receiptNumber: initial?.receiptNumber || "",
    description: initial?.description || "",
    amount: initial?.amount || "",
    jy: initial?.jy || today[0],
    jm: initial?.jm || today[1],
    jd: initial?.jd || today[2],
    noticeId: initial?.noticeId || null,
    manualPoints: initial?.manualPoints ?? 0,
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const customerOptions = customers.map((c) => ({ id: c.id, label: `${c.firstName} ${c.lastName}` }));
  const noticeOptions = notices.map((n) => ({
    id: n.id,
    label: `ابلاغیه ${n.noticeNumber} — ${formatRial(n.amount)}`,
  }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.customerId || !form.amount) return;
    onSubmit({
      ...form,
      jy: parseInt(form.jy),
      jm: parseInt(form.jm),
      jd: parseInt(form.jd),
      amount: parseInt(form.amount) || 0,
      manualPoints: parseInt(form.manualPoints) || 0,
    });
  };

  return (
    <ModalShell title={initial ? "ویرایش واریزی" : "اضافه کردن واریزی"} onClose={onClose} onDelete={onDelete}>
      <form onSubmit={submit} className="form">
        <Field label="نوع واریزی">
          <div className="type-toggle">
            <button
              type="button"
              className={`type-toggle-btn ${form.depositType === "cash" ? "active" : ""}`}
              onClick={() => setForm((f) => ({ ...f, depositType: "cash" }))}
            >
              نقدی
            </button>
            <button
              type="button"
              className={`type-toggle-btn ${form.depositType === "noncash" ? "active" : ""}`}
              onClick={() => setForm((f) => ({ ...f, depositType: "noncash" }))}
            >
              غیر نقدی
            </button>
          </div>
        </Field>

        {form.depositType === "cash" ? (
          <Field label="شماره فیش">
            <input className="input" value={form.receiptNumber} onChange={set("receiptNumber")} />
          </Field>
        ) : (
          <Field label="شرح / بابت">
            <input
              className="input"
              value={form.description}
              onChange={set("description")}
              placeholder="مثلاً: بابت تهاتر با فاکتور..."
            />
          </Field>
        )}

        <Field label="مشتری (اسم و فامیل)">
          <SearchableSelect
            options={customerOptions}
            value={form.customerId}
            onChange={(id) => setForm((f) => ({ ...f, customerId: id || "" }))}
            placeholder="جستجوی نام مشتری..."
            emptyText="مشتری‌ای یافت نشد"
          />
        </Field>
        <Field label="مقدار واریزی (ریال)">
          <FormattedAmountInput
            value={form.amount}
            onChange={(v) => setForm((f) => ({ ...f, amount: v }))}
            required
          />
        </Field>
        <Field label="تاریخ واریزی (شمسی)">
          <JalaliDateFields jy={form.jy} jm={form.jm} jd={form.jd} onChange={(v) => setForm((f) => ({ ...f, ...v }))} />
        </Field>
        <Field label="ابلاغیه‌ی مرتبط (اختیاری)">
          <SearchableSelect
            options={noticeOptions}
            value={form.noticeId}
            onChange={(id) => setForm((f) => ({ ...f, noticeId: id }))}
            placeholder="جستجوی شماره ابلاغیه..."
            emptyText="ابلاغیه‌ای یافت نشد"
          />
        </Field>
        <Field label="امتیاز دستی (اضافه/کسر می‌شود روی امتیاز خودکار)">
          <input className="input" type="number" value={form.manualPoints} onChange={set("manualPoints")} inputMode="numeric" />
        </Field>

        <button type="submit" className="submit-btn">
          {initial ? "ذخیره تغییرات" : "ثبت واریزی"}
        </button>
      </form>
    </ModalShell>
  );
}
