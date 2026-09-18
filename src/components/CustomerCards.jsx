import React from "react";
import { Icon } from "./Icons";
import { formatToman, formatJalali } from "../utils/dateUtils";
import { ElapsedTimer } from "./ElapsedTimer";

export function CustomerCard({ customer, rank, onEdit, onDelete }) {
  return (
    <div className="card card-pop">
      {rank <= 3 && customer.points > 0 && (
        <div
          className="rank-badge"
          style={{ background: rank === 1 ? "#e0b04a" : rank === 2 ? "#b8b8c4" : "#c98a5c" }}
        >
          {rank}
        </div>
      )}
      <div className="card-main">
        <div className="card-name">
          {customer.firstName} {customer.lastName}
        </div>
        <div className="card-meta-row">
          <span className="card-meta-tag">پرونده: {customer.caseNumber || "—"}</span>
          {customer.lastDeposit ? (
            <span className="card-meta-tag">آخرین واریزی: {formatToman(customer.lastDeposit.amount)}</span>
          ) : (
            <span className="card-meta-tag">بدون واریزی</span>
          )}
        </div>
        <div className="card-meta-row" style={{ marginTop: 2 }}>
          <span className="card-meta-tag total-deposit-tag">مجموع واریزی: {formatToman(customer.totalDeposits)}</span>
        </div>
        <div className="points-row">
          <Icon.star color="#e0a458" />
          <span className="points-value">{customer.points.toLocaleString("fa-IR")}</span>
          <span className="points-label">امتیاز</span>
          {customer.manualPoints ? (
            <span className="manual-points-badge">
              {customer.manualPoints > 0 ? "+" : ""}
              {customer.manualPoints.toLocaleString("fa-IR")} دستی
            </span>
          ) : null}
        </div>
      </div>
      <div className="card-actions">
        <button className="icon-btn" onClick={onEdit} title="ویرایش">
          <Icon.edit />
        </button>
        <button className="icon-btn danger" onClick={onDelete} title="حذف">
          <Icon.trash />
        </button>
      </div>
    </div>
  );
}

/** کارت هر فیش واریزی به‌صورت جداگانه (نه تجمیع‌شده روی مشتری) */
export function DepositReceiptCard({ deposit, customerName, onEdit, onDelete }) {
  return (
    <div className="card card-pop">
      <div className="card-main">
        <div className="card-name">فیش: {deposit.receiptNumber || "—"}</div>
        <div className="card-meta-row">
          <span className="card-meta-tag">{customerName}</span>
          <span className="card-meta-tag">واریزی: {formatToman(deposit.amount)}</span>
          <span className="card-meta-tag">{formatJalali(deposit.jy, deposit.jm, deposit.jd)}</span>
        </div>
        <div className="points-row">
          <Icon.star color="#e0a458" />
          <span className="points-value">{deposit.points.toLocaleString("fa-IR")}</span>
          <span className="points-label">امتیاز این فیش</span>
          {deposit.manualPoints ? (
            <span className="manual-points-badge">
              {deposit.manualPoints > 0 ? "+" : ""}
              {deposit.manualPoints.toLocaleString("fa-IR")} دستی
            </span>
          ) : null}
        </div>
        <ElapsedTimer jy={deposit.jy} jm={deposit.jm} jd={deposit.jd} />
      </div>
      <div className="card-actions">
        <button className="icon-btn" onClick={onEdit} title="ویرایش">
          <Icon.edit />
        </button>
        <button className="icon-btn danger" onClick={onDelete} title="حذف">
          <Icon.trash />
        </button>
      </div>
    </div>
  );
}

export function NoticeCard({ notice, onEdit, onDelete }) {
  return (
    <div className="card card-pop">
      <div className="card-main">
        <div className="card-name">ابلاغیه {notice.noticeNumber}</div>
        <div className="card-meta-row">
          <span className="card-meta-tag">{formatToman(notice.amount)}</span>
          <span className="card-meta-tag">{formatJalali(notice.jy, notice.jm, notice.jd)}</span>
        </div>
      </div>
      <div className="card-actions">
        <button className="icon-btn" onClick={onEdit} title="ویرایش">
          <Icon.edit />
        </button>
        <button className="icon-btn danger" onClick={onDelete} title="حذف">
          <Icon.trash />
        </button>
      </div>
    </div>
  );
}
