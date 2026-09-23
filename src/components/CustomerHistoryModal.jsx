import React from "react";
import { ModalShell } from "./ModalShell";
import { Icon } from "./Icons";
import { ElapsedTimer } from "./ElapsedTimer";
import { formatRial, formatJalali } from "../utils/dateUtils";

/**
 * تاریخچه‌ی کامل واریزی‌های یک مشتری خاص — هر فیش با تمام جزئیات
 * (مبلغ، شماره فیش، تاریخ، امتیاز خودکار + دستی، زمان سپری‌شده).
 */
export function CustomerHistoryModal({ customer, deposits, onClose, onEditDeposit, onDeleteDeposit }) {
  const totalAmount = deposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const totalPoints = deposits.reduce((sum, d) => sum + (Number(d.points) || 0), 0);

  return (
    <ModalShell title={`تاریخچه‌ی واریزی‌های ${customer.firstName} ${customer.lastName}`} onClose={onClose} wide>
      <div className="history-summary">
        <div className="history-summary-item">
          <span className="history-summary-value">{deposits.length.toLocaleString("fa-IR")}</span>
          <span className="history-summary-label">تعداد فیش</span>
        </div>
        <div className="history-summary-item">
          <span className="history-summary-value">{formatRial(totalAmount)}</span>
          <span className="history-summary-label">مجموع واریزی</span>
        </div>
        <div className="history-summary-item">
          <span className="history-summary-value">{totalPoints.toLocaleString("fa-IR")}</span>
          <span className="history-summary-label">مجموع امتیاز</span>
        </div>
      </div>

      <div className="history-list">
        {deposits.length === 0 ? (
          <div className="empty-state">این مشتری هنوز هیچ واریزی‌ای ثبت نکرده است.</div>
        ) : (
          deposits.map((d, idx) => (
            <div className="history-item" key={d.id}>
              <div className="history-item-index">{idx + 1}</div>
              <div className="history-item-main">
                <div className="history-item-top">
                  <span className="history-item-receipt">
                    {d.depositType === "noncash" ? `غیر نقدی: ${d.description || "—"}` : `فیش: ${d.receiptNumber || "—"}`}
                  </span>
                  <span className="history-item-amount">{formatRial(d.amount)}</span>
                </div>
                <div className="history-item-meta">
                  <span className="card-meta-tag">{formatJalali(d.jy, d.jm, d.jd)}</span>
                  <span className={`card-meta-tag deposit-type-tag ${d.depositType === "noncash" ? "noncash" : "cash"}`}>
                    {d.depositType === "noncash" ? "غیر نقدی" : "نقدی"}
                  </span>
                  <span className="card-meta-tag">
                    <Icon.star color="#e0a458" style={{ verticalAlign: "-2px", marginLeft: 4 }} />
                    {d.points.toLocaleString("fa-IR")} امتیاز
                  </span>
                  {d.manualPoints ? (
                    <span className="manual-points-badge">
                      {d.manualPoints > 0 ? "+" : ""}
                      {d.manualPoints.toLocaleString("fa-IR")} دستی
                    </span>
                  ) : null}
                </div>
                <ElapsedTimer jy={d.jy} jm={d.jm} jd={d.jd} />
              </div>
              <div className="history-item-actions">
                <button className="icon-btn" onClick={() => onEditDeposit(d.id)} title="ویرایش">
                  <Icon.edit />
                </button>
                <button className="icon-btn danger" onClick={() => onDeleteDeposit(d.id)} title="حذف">
                  <Icon.trash />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </ModalShell>
  );
}
