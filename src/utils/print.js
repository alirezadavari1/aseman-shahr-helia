import { formatRial, formatJalali, jalaliDateObjFromParts } from "./dateUtils";
import logoBase64 from "./printLogoBase64.js";

const PRINT_STYLES = `
  @page { size: A4; margin: 16mm; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Vazirmatn', 'Tahoma', sans-serif;
    direction: rtl;
    color: #2a2136;
    margin: 0;
    padding: 24px;
  }
  .print-header {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 14px;
    margin-bottom: 18px;
    padding-bottom: 14px;
    border-bottom: 2px solid #2a2136;
  }
  .print-logo { width: 58px; height: 58px; object-fit: contain; flex-shrink: 0; }
  .print-header-text { text-align: right; }
  .print-company-name { font-size: 19px; font-weight: 900; color: #2a2136; }
  .print-doc-title { font-size: 13.5px; color: #6f6288; margin-top: 3px; font-weight: 700; }
  .print-sub { font-size: 12px; color: #6f6288; margin: 0 0 20px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th, td { border: 1px solid #ddd0ea; padding: 8px 10px; font-size: 12.5px; text-align: right; }
  th { background: #f3edfb; font-weight: 700; }
  tr:nth-child(even) td { background: #faf7fd; }
  .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 24px; margin-bottom: 22px; }
  .info-item { font-size: 13px; padding: 8px 12px; background: #f6f1fb; border-radius: 8px; }
  .info-item b { color: #6f6288; font-weight: 600; margin-left: 6px; }
  .summary-row { display: flex; gap: 14px; margin-bottom: 18px; }
  .summary-chip { flex: 1; background: #f0e2f7; border-radius: 10px; padding: 10px; text-align: center; }
  .summary-chip .val { font-size: 15px; font-weight: 800; display: block; }
  .summary-chip .lbl { font-size: 11px; color: #6f6288; }
`;

function printHeaderHtml(docTitle) {
  return `
    <div class="print-header">
      <img class="print-logo" src="data:image/png;base64,${logoBase64}" />
      <div class="print-header-text">
        <div class="print-company-name">شرکت تعاونی آسمان شهر هلیا</div>
        <div class="print-doc-title">${docTitle}</div>
      </div>
    </div>
  `;
}

function openPrintWindow(title, bodyHtml) {
  const win = window.open("", "_blank", "width=900,height=1000");
  if (!win) {
    alert("مرورگر اجازه‌ی باز کردن پنجره‌ی چاپ را نداد. لطفاً پاپ‌آپ را برای این سایت فعال کنید.");
    return;
  }
  win.document.open();
  win.document.write(`
    <!doctype html>
    <html lang="fa" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <title>${title}</title>
        <style>${PRINT_STYLES}</style>
      </head>
      <body>
        ${bodyHtml}
      </body>
    </html>
  `);
  win.document.close();
  win.focus();
  // کمی تأخیر تا فونت‌ها، لوگو و چیدمان کامل رندر شوند، سپس چاپ مستقیم باز شود
  setTimeout(() => {
    win.print();
  }, 400);
}

const depositTypeLabel = (d) => (d.depositType === "noncash" ? "غیر نقدی" : "نقدی");

/** چاپ لیست کامل همه‌ی مشتری‌ها با اطلاعات خلاصه — به ترتیب رتبه (بیشترین امتیاز اول) */
export function printCustomersList(customers) {
  const rows = customers
    .map(
      (c, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${c.firstName} ${c.lastName}</td>
        <td>${c.caseNumber || "—"}</td>
        <td>${c.nationalId || "—"}</td>
        <td style="direction:ltr;text-align:left">${c.phone || "—"}</td>
        <td>${formatRial(c.totalDeposits || 0)}</td>
        <td>${(c.points || 0).toLocaleString("fa-IR")}</td>
      </tr>
    `
    )
    .join("");

  const body = `
    ${printHeaderHtml("لیست مشتریان")}
    <p class="print-sub">تاریخ چاپ: ${new Date().toLocaleDateString("fa-IR")} — تعداد کل: ${customers.length.toLocaleString(
    "fa-IR"
  )} نفر</p>
    <table>
      <thead>
        <tr>
          <th>رتبه</th>
          <th>نام و نام خانوادگی</th>
          <th>شماره پرونده</th>
          <th>کد ملی</th>
          <th>شماره تماس</th>
          <th>مجموع واریزی</th>
          <th>امتیاز</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  openPrintWindow("لیست مشتریان", body);
}

/** چاپ پرونده‌ی کامل یک مشتری خاص همراه با تمام واریزی‌هایش، به ترتیب تاریخ از قدیم به جدید */
export function printCustomerDetail(customer, deposits) {
  const sortedByDateAsc = [...deposits].sort((a, b) => {
    const da = jalaliDateObjFromParts(a.jy, a.jm, a.jd).getTime();
    const db = jalaliDateObjFromParts(b.jy, b.jm, b.jd).getTime();
    return da - db;
  });

  const totalAmount = sortedByDateAsc.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  const totalPoints = sortedByDateAsc.reduce((sum, d) => sum + (Number(d.points) || 0), 0);

  const depositRows = sortedByDateAsc
    .map(
      (d, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${depositTypeLabel(d)}</td>
        <td>${d.depositType === "noncash" ? d.description || "—" : d.receiptNumber || "—"}</td>
        <td>${formatRial(d.amount)}</td>
        <td>${formatJalali(d.jy, d.jm, d.jd)}</td>
        <td>${(d.points || 0).toLocaleString("fa-IR")}</td>
      </tr>
    `
    )
    .join("");

  const joinDate =
    customer.joinJy && customer.joinJm && customer.joinJd
      ? formatJalali(customer.joinJy, customer.joinJm, customer.joinJd)
      : "—";

  const body = `
    ${printHeaderHtml(`پرونده‌ی مشتری — ${customer.firstName} ${customer.lastName}`)}
    <p class="print-sub">تاریخ چاپ: ${new Date().toLocaleDateString("fa-IR")}</p>

    <div class="info-grid">
      <div class="info-item"><b>نام و نام خانوادگی:</b>${customer.firstName} ${customer.lastName}</div>
      <div class="info-item"><b>کد ملی:</b>${customer.nationalId || "—"}</div>
      <div class="info-item"><b>شماره تماس:</b>${customer.phone || "—"}</div>
      <div class="info-item"><b>شماره پرونده:</b>${customer.caseNumber || "—"}</div>
      <div class="info-item"><b>تاریخ عضویت:</b>${joinDate}</div>
      <div class="info-item"><b>تعداد فیش‌ها:</b>${deposits.length.toLocaleString("fa-IR")}</div>
    </div>

    <div class="summary-row">
      <div class="summary-chip"><span class="val">${formatRial(totalAmount)}</span><span class="lbl">مجموع واریزی</span></div>
      <div class="summary-chip"><span class="val">${totalPoints.toLocaleString("fa-IR")}</span><span class="lbl">مجموع امتیاز</span></div>
      <div class="summary-chip"><span class="val">${(customer.manualDepositAdjustment || 0).toLocaleString(
        "fa-IR"
      )}</span><span class="lbl">تنظیم دستی واریزی</span></div>
    </div>

    <table>
      <thead>
        <tr>
          <th>ردیف</th>
          <th>نوع واریزی</th>
          <th>شماره فیش / شرح</th>
          <th>مبلغ</th>
          <th>تاریخ</th>
          <th>امتیاز</th>
        </tr>
      </thead>
      <tbody>${depositRows || `<tr><td colspan="6" style="text-align:center">واریزی‌ای ثبت نشده</td></tr>`}</tbody>
    </table>
  `;

  openPrintWindow(`پرونده ${customer.firstName} ${customer.lastName}`, body);
}
