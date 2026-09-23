import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { Toast } from "./components/Toast";
import { BackgroundDecor } from "./components/BackgroundDecor";
import { Section, EmptyState, ShowMoreButton } from "./components/Shared";
import { CustomerCard, DepositReceiptCard, NoticeCard } from "./components/CustomerCards";
import { CustomerModal } from "./components/CustomerModal";
import { DepositModal } from "./components/DepositModal";
import { NoticeModal } from "./components/NoticeModal";
import { DateRangeFilterModal } from "./components/DateRangeFilterModal";
import { CustomerHistoryModal } from "./components/CustomerHistoryModal";
import { Icon } from "./components/Icons";
import { useShowMore } from "./utils/useShowMore";
import { printCustomersList, printCustomerDetail } from "./utils/print";
import {
  jalaliDateObjFromParts,
  computeAutoPoints,
  tehranClockFormatter,
  tehranJalaliParts,
  formatJalali,
  formatRial,
  appNow,
  setClockOffset,
} from "./utils/dateUtils";
import {
  loadState,
  loadStateAsync,
  saveState,
  exportStateToFile,
  importStateFromFile,
  mergeImportedState,
  isElectron,
} from "./utils/storage";
import "./styles.css";

export default function App() {
  const [state, setState] = useState(loadState);
  const [modal, setModal] = useState(null); // { type: 'customer'|'deposit'|'notice'|'customerHistory', editId?, customerId? }
  const [clock, setClock] = useState("");
  const [todayJalali, setTodayJalali] = useState([1403, 1, 1]);
  const [toast, setToast] = useState(null);

  // بارگذاری واقعی اطلاعات: در نسخه‌ی دسکتاپ از فایل اصلی روی دیسک (نه فقط حافظه‌ی مرورگر)
  useEffect(() => {
    let cancelled = false;
    loadStateAsync().then((loaded) => {
      if (!cancelled && loaded) setState(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // همگام‌سازی «زمان قابل اعتماد»: هنگام باز شدن برنامه و هر ۱۰ دقیقه یک‌بار،
  // تا هم وضعیت آنلاین/آفلاین و هم درست یا خراب‌بودن ساعت سیستم پوشش داده شود.
  useEffect(() => {
    if (!isElectron()) return;
    let cancelled = false;
    const sync = async () => {
      try {
        const trustedMs = await window.electronAPI.getTrustedNow();
        if (!cancelled && Number.isFinite(trustedMs)) {
          setClockOffset(trustedMs - Date.now());
        }
      } catch (e) {
        // اگر همگام‌سازی شکست بخورد، آفست قبلی (یا صفر) همچنان به‌کار می‌رود
      }
    };
    sync();
    const id = setInterval(sync, 10 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    const fmt = tehranClockFormatter();
    const tick = () => {
      setClock(fmt.format(appNow()));
      setTodayJalali(tehranJalaliParts(appNow()));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }, []);

  /* ----- فیلترهای بازه‌ی تاریخ ----- */
  const [depositFilter, setDepositFilter] = useState(null); // {fromJ:[jy,jm,jd], toJ:[jy,jm,jd]} | null
  const [noticeFilter, setNoticeFilter] = useState(null);
  const [filterModal, setFilterModal] = useState(null); // 'deposit' | 'notice' | null

  const isWithinRange = (jy, jm, jd, range) => {
    if (!range) return true;
    const d = jalaliDateObjFromParts(jy, jm, jd).getTime();
    const from = jalaliDateObjFromParts(...range.fromJ).getTime();
    const to = jalaliDateObjFromParts(...range.toJ).getTime();
    return d >= from && d <= to;
  };

  /* ----- ردیف‌های مشتری: امتیاز و مجموع واریزی، هماهنگ با فیلتر تاریخ واریزی -----
     وقتی فیلتر فعال است: فقط واریزی‌های داخل بازه حساب می‌شود و امتیاز «تا تاریخ پایانِ بازه» است.
     وقتی فیلتر پاک شود: خودکار به حالت عادی (همه‌ی واریزی‌ها، تا همین الان) برمی‌گردد. */
  const customerRows = useMemo(() => {
    const referenceDate = depositFilter ? jalaliDateObjFromParts(...depositFilter.toJ) : appNow();
    return state.customers
      .map((c) => {
        const myDeposits = state.deposits.filter(
          (d) => d.customerId === c.id && isWithinRange(d.jy, d.jm, d.jd, depositFilter)
        );
        let autoPoints = 0;
        let manualPoints = 0;
        let lastDeposit = null;
        let depositsSum = 0;
        myDeposits.forEach((d) => {
          autoPoints += computeAutoPoints(d.amount, d.jy, d.jm, d.jd, referenceDate);
          manualPoints += Number(d.manualPoints) || 0;
          depositsSum += Number(d.amount) || 0;
          const depDate = jalaliDateObjFromParts(d.jy, d.jm, d.jd);
          if (!lastDeposit || depDate > jalaliDateObjFromParts(lastDeposit.jy, lastDeposit.jm, lastDeposit.jd)) {
            lastDeposit = d;
          }
        });
        const totalDeposits = depositsSum + (Number(c.manualDepositAdjustment) || 0);
        return {
          ...c,
          points: autoPoints + manualPoints,
          manualPoints,
          lastDeposit,
          depositCount: myDeposits.length,
          totalDeposits,
        };
      })
      .filter((c) => c.depositCount > 0 || !depositFilter)
      .sort((a, b) => b.points - a.points);
  }, [state.customers, state.deposits, depositFilter, clock]);

  /* ----- تاریخچه‌ی کامل واریزی‌های هر مشتری، همیشه تا همین الان (مستقل از فیلتر/جستجوی ستون واریزی) ----- */
  const allDepositsWithPoints = useMemo(() => {
    const now = appNow();
    return state.deposits
      .map((d) => ({
        ...d,
        points: computeAutoPoints(d.amount, d.jy, d.jm, d.jd, now) + (Number(d.manualPoints) || 0),
      }))
      .sort((a, b) => {
        const da = jalaliDateObjFromParts(a.jy, a.jm, a.jd).getTime();
        const db = jalaliDateObjFromParts(b.jy, b.jm, b.jd).getTime();
        return db - da;
      });
  }, [state.deposits, clock]);

  /* ----- لیست تک‌تک فیش‌های واریزی (هر فیش جداگانه، نه تجمیع‌شده) ----- */
  const [depositSearch, setDepositSearch] = useState("");

  const individualDeposits = useMemo(() => {
    const referenceDate = depositFilter ? jalaliDateObjFromParts(...depositFilter.toJ) : appNow();
    const q = depositSearch.trim();
    return state.deposits
      .filter((d) => isWithinRange(d.jy, d.jm, d.jd, depositFilter))
      .map((d) => {
        const customer = state.customers.find((c) => c.id === d.customerId);
        const customerName = customer ? `${customer.firstName} ${customer.lastName}` : "—";
        const autoPoints = computeAutoPoints(d.amount, d.jy, d.jm, d.jd, referenceDate);
        const points = autoPoints + (Number(d.manualPoints) || 0);
        return { ...d, customerName, points };
      })
      .filter((d) => !q || (d.receiptNumber || "").includes(q) || d.customerName.includes(q))
      .sort((a, b) => b.points - a.points);
  }, [state.deposits, state.customers, depositFilter, depositSearch, clock]);

  /* ----- ابلاغیه‌ها: فیلتر تاریخ + جستجو ----- */
  const [noticeSearch, setNoticeSearch] = useState("");

  const filteredNoticesByAmount = useMemo(() => {
    const q = noticeSearch.trim();
    return [...state.notices]
      .filter((n) => isWithinRange(n.jy, n.jm, n.jd, noticeFilter))
      .filter((n) => !q || (n.noticeNumber || "").includes(q))
      .sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0));
  }, [state.notices, noticeFilter, noticeSearch]);

  /* ----- جستجوی مشتری‌ها ----- */
  const [customerSearch, setCustomerSearch] = useState("");

  const displayedCustomers = useMemo(() => {
    const q = customerSearch.trim();
    if (!q) return customerRows;
    return customerRows.filter((c) => {
      const full = `${c.firstName} ${c.lastName}`;
      return (
        c.firstName.includes(q) ||
        c.lastName.includes(q) ||
        full.includes(q) ||
        (c.caseNumber || "").includes(q)
      );
    });
  }, [customerRows, customerSearch]);

  const customerShowMore = useShowMore(displayedCustomers.length);
  const depositShowMore = useShowMore(individualDeposits.length);
  const noticeShowMore = useShowMore(filteredNoticesByAmount.length);

  /* ----- باکس‌های بالای صفحه: آخرین واریزی/ابلاغیه (بر اساس زمان واقعیِ ثبت) ----- */
  const sortedDeposits = useMemo(() => {
    return [...state.deposits].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [state.deposits]);

  const sortedNotices = useMemo(() => {
    return [...state.notices].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [state.notices]);

  const latestOverallDeposit = useMemo(() => {
    if (sortedDeposits.length === 0) return null;
    const d = sortedDeposits[0];
    const cust = state.customers.find((c) => c.id === d.customerId);
    return { ...d, customerName: cust ? `${cust.firstName} ${cust.lastName}` : "—" };
  }, [sortedDeposits, state.customers]);

  const latestOverallNotice = useMemo(() => {
    if (sortedNotices.length === 0) return null;
    return sortedNotices[0];
  }, [sortedNotices]);

  const totals = useMemo(() => {
    const totalDeposits = state.deposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    return { totalDeposits };
  }, [state.deposits]);

  /* ----- عملیات CRUD ----- */
  const addOrUpdateCustomer = (data, editId) => {
    setState((s) => {
      if (editId) {
        return { ...s, customers: s.customers.map((c) => (c.id === editId ? { ...c, ...data } : c)) };
      }
      return { ...s, customers: [...s.customers, { id: crypto.randomUUID(), ...data }] };
    });
    showToast(editId ? "اطلاعات مشتری ویرایش شد" : "مشتری جدید ساخته شد");
  };

  const deleteCustomer = (id) => {
    setState((s) => ({
      ...s,
      customers: s.customers.filter((c) => c.id !== id),
      deposits: s.deposits.filter((d) => d.customerId !== id),
    }));
    showToast("مشتری حذف شد");
  };

  const addOrUpdateDeposit = (data, editId) => {
    setState((s) => {
      if (editId) {
        return {
          ...s,
          deposits: s.deposits.map((d) => (d.id === editId ? { ...d, ...data, createdAt: Date.now() } : d)),
        };
      }
      // هر بار «اضافه کردن واریزی» یک فیش کاملاً جدید و جداگانه می‌سازد،
      // حتی اگر برای همان مشتریِ قبلی باشد.
      return { ...s, deposits: [...s.deposits, { id: crypto.randomUUID(), ...data, createdAt: Date.now() }] };
    });
    showToast(editId ? "واریزی ویرایش شد" : "واریزی جدید ثبت شد");
  };

  const deleteDeposit = (id) => {
    setState((s) => ({ ...s, deposits: s.deposits.filter((d) => d.id !== id) }));
    showToast("واریزی حذف شد");
  };

  const addOrUpdateNotice = (data, editId) => {
    setState((s) => {
      if (editId) {
        return {
          ...s,
          notices: s.notices.map((n) => (n.id === editId ? { ...n, ...data, createdAt: Date.now() } : n)),
        };
      }
      return { ...s, notices: [...s.notices, { id: crypto.randomUUID(), ...data, createdAt: Date.now() }] };
    });
    showToast(editId ? "ابلاغیه ویرایش شد" : "ابلاغیه ثبت شد");
  };

  const deleteNotice = (id) => {
    setState((s) => ({ ...s, notices: s.notices.filter((n) => n.id !== id) }));
    showToast("ابلاغیه حذف شد");
  };

  /* ----- خروجی / ورودی JSON (بک‌آپ) ----- */
  const handleExport = async () => {
    const result = await exportStateToFile(state);
    if (result?.canceled) return;
    if (result?.error) {
      showToast("خطا در ذخیره‌ی فایل پشتیبان");
      return;
    }
    showToast(isElectron() ? "فایل پشتیبان ذخیره شد" : "فایل پشتیبان دانلود شد");
  };

  const handleImportFile = async (file) => {
    try {
      const imported = await importStateFromFile(file);
      if (!imported) return; // کاربر پنجره‌ی انتخاب فایل را بست
      setState((s) => mergeImportedState(s, imported));
      showToast("اطلاعات فایل با موفقیت اضافه شد");
    } catch (err) {
      showToast("خطا در خواندن فایل. فرمت را بررسی کنید");
    }
  };

  /* ----- چاپ ----- */
  const handlePrintAllCustomers = () => {
    printCustomersList(customerRows);
  };

  const handlePrintCustomer = (customerId) => {
    const customer = state.customers.find((c) => c.id === customerId);
    if (!customer) return;
    const deposits = allDepositsWithPoints.filter((d) => d.customerId === customerId);
    printCustomerDetail(customer, deposits);
  };

  const editingCustomer = modal?.type === "customer" ? state.customers.find((c) => c.id === modal.editId) : null;
  const editingCustomerRow = modal?.type === "customer" ? customerRows.find((c) => c.id === modal.editId) : null;

  return (
    <div dir="rtl" className="page">
      <BackgroundDecor />

      <Header clock={clock} todayJalali={todayJalali} />

      <div className="latest-grid">
        {latestOverallDeposit && (
          <div className="latest-box fade-in-up" key={`deposit-${latestOverallDeposit.id}`}>
            <div className="latest-icon-wrap">
              <Icon.coin color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div className="latest-label">آخرین واریزی ثبت‌شده</div>
              <div className="latest-main">
                <span className="latest-name">{latestOverallDeposit.customerName}</span>
                <span className="latest-amount">{formatRial(latestOverallDeposit.amount)}</span>
                <span className="latest-date">
                  {formatJalali(latestOverallDeposit.jy, latestOverallDeposit.jm, latestOverallDeposit.jd)}
                </span>
              </div>
            </div>
          </div>
        )}

        {latestOverallNotice && (
          <div className="latest-box fade-in-up" key={`notice-${latestOverallNotice.id}`}>
            <div className="latest-icon-wrap" style={{ background: "linear-gradient(135deg, #e0a458, #5fb4a2)" }}>
              <Icon.bell color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div className="latest-label">آخرین ابلاغیه ثبت‌شده</div>
              <div className="latest-main">
                <span className="latest-name">ابلاغیه {latestOverallNotice.noticeNumber}</span>
                <span className="latest-amount">{formatRial(latestOverallNotice.amount)}</span>
                <span className="latest-date">
                  {formatJalali(latestOverallNotice.jy, latestOverallNotice.jm, latestOverallNotice.jd)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="stats-bar fade-in-up">
        <div className="stat-chip">
          <Icon.coin color="#5fb4a2" />
          <div>
            <div className="stat-value">{formatRial(totals.totalDeposits)}</div>
            <div className="stat-label">مجموع کل واریزی‌ها</div>
          </div>
        </div>
      </div>

      <main className="columns">
        {/* ستون ۱: مشتریان */}
        <Section
          title="مشتری‌ها"
          accent="#c98bd6"
          actionLabel="اضافه کردن مشتری"
          onAction={() => setModal({ type: "customer" })}
          icon={<Icon.plus />}
          extraActions={
            <button className="filter-btn" onClick={handlePrintAllCustomers}>
              <Icon.print />
              چاپ همه
            </button>
          }
        >
          <div className="search-bar-wrap">
            <Icon.search className="search-icon" />
            <input
              className="search-input"
              type="text"
              placeholder="جستجو با نام، نام خانوادگی یا شماره پرونده..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
            />
            {customerSearch && (
              <button className="search-clear" onClick={() => setCustomerSearch("")} title="پاک کردن">
                <Icon.close />
              </button>
            )}
          </div>
          {customerSearch && (
            <div className="search-result-count">
              {displayedCustomers.length.toLocaleString("fa-IR")} نتیجه پیدا شد
            </div>
          )}
          {depositFilter && (
            <div className="filter-badge">
              <span>
                امتیازها تا {formatJalali(...depositFilter.toJ)} (بازه‌ی {formatJalali(...depositFilter.fromJ)} تا{" "}
                {formatJalali(...depositFilter.toJ)})
              </span>
              <button onClick={() => setDepositFilter(null)}>حذف فیلتر</button>
            </div>
          )}
          {displayedCustomers.length === 0 ? (
            <EmptyState
              text={
                customerSearch
                  ? "مشتری‌ای با این مشخصات پیدا نشد."
                  : "هنوز مشتری‌ای ثبت نشده. با «اضافه کردن مشتری» شروع کنید."
              }
            />
          ) : (
            <>
              {displayedCustomers.slice(0, customerShowMore.visibleCount).map((c, idx) => (
                <CustomerCard
                  key={c.id}
                  customer={c}
                  rank={displayedCustomers.findIndex((x) => x.id === c.id) + 1}
                  onEdit={() => setModal({ type: "customer", editId: c.id })}
                  onDelete={() => deleteCustomer(c.id)}
                  onViewHistory={() => setModal({ type: "customerHistory", editId: c.id })}
                  onPrint={() => handlePrintCustomer(c.id)}
                />
              ))}
              {customerShowMore.hasMore && (
                <ShowMoreButton onClick={customerShowMore.showMore} remaining={customerShowMore.remaining} />
              )}
            </>
          )}
        </Section>

        {/* ستون ۲: واریزی‌ها (هر فیش جداگانه) */}
        <Section
          title="واریزی"
          accent="#5fb4a2"
          actionLabel="اضافه کردن واریزی"
          onAction={() => setModal({ type: "deposit" })}
          icon={<Icon.plus />}
          extraActions={
            <button className="filter-btn" onClick={() => setFilterModal("deposit")}>
              <Icon.filter />
              فیلتر تاریخ
            </button>
          }
        >
          <div className="search-bar-wrap">
            <Icon.search className="search-icon" />
            <input
              className="search-input"
              type="text"
              placeholder="جستجو با شماره فیش یا نام مشتری..."
              value={depositSearch}
              onChange={(e) => setDepositSearch(e.target.value)}
            />
            {depositSearch && (
              <button className="search-clear" onClick={() => setDepositSearch("")} title="پاک کردن">
                <Icon.close />
              </button>
            )}
          </div>
          {depositSearch && (
            <div className="search-result-count">
              {individualDeposits.length.toLocaleString("fa-IR")} نتیجه پیدا شد
            </div>
          )}
          {depositFilter && (
            <div className="filter-badge">
              <span>
                امتیازها تا {formatJalali(...depositFilter.toJ)} (بازه‌ی {formatJalali(...depositFilter.fromJ)} تا{" "}
                {formatJalali(...depositFilter.toJ)})
              </span>
              <button onClick={() => setDepositFilter(null)}>حذف فیلتر</button>
            </div>
          )}
          {individualDeposits.length === 0 ? (
            <EmptyState
              text={
                depositFilter || depositSearch
                  ? "واریزی‌ای با این مشخصات یافت نشد."
                  : "هنوز واریزی‌ای ثبت نشده. با «اضافه کردن واریزی» شروع کنید."
              }
            />
          ) : (
            <>
              {individualDeposits.slice(0, depositShowMore.visibleCount).map((d) => (
                <DepositReceiptCard
                  key={d.id}
                  deposit={d}
                  customerName={d.customerName}
                  onEdit={() => setModal({ type: "deposit", editId: d.id })}
                  onDelete={() => deleteDeposit(d.id)}
                />
              ))}
              {depositShowMore.hasMore && (
                <ShowMoreButton onClick={depositShowMore.showMore} remaining={depositShowMore.remaining} />
              )}
            </>
          )}
        </Section>

        {/* ستون ۳: ابلاغیه‌ها */}
        <Section
          title="ابلاغیه‌ها"
          accent="#e0a458"
          actionLabel="اضافه کردن ابلاغیه"
          onAction={() => setModal({ type: "notice" })}
          icon={<Icon.bell />}
          extraActions={
            <button className="filter-btn" onClick={() => setFilterModal("notice")}>
              <Icon.filter />
              فیلتر تاریخ
            </button>
          }
        >
          <div className="search-bar-wrap">
            <Icon.search className="search-icon" />
            <input
              className="search-input"
              type="text"
              placeholder="جستجو با شماره ابلاغیه..."
              value={noticeSearch}
              onChange={(e) => setNoticeSearch(e.target.value)}
            />
            {noticeSearch && (
              <button className="search-clear" onClick={() => setNoticeSearch("")} title="پاک کردن">
                <Icon.close />
              </button>
            )}
          </div>
          {noticeSearch && (
            <div className="search-result-count">
              {filteredNoticesByAmount.length.toLocaleString("fa-IR")} نتیجه پیدا شد
            </div>
          )}
          {noticeFilter && (
            <div className="filter-badge">
              <span>
                از {formatJalali(...noticeFilter.fromJ)} تا {formatJalali(...noticeFilter.toJ)}
              </span>
              <button onClick={() => setNoticeFilter(null)}>حذف فیلتر</button>
            </div>
          )}
          {filteredNoticesByAmount.length === 0 ? (
            <EmptyState
              text={
                noticeFilter || noticeSearch
                  ? "ابلاغیه‌ای با این مشخصات یافت نشد."
                  : "هنوز ابلاغیه‌ای ثبت نشده."
              }
            />
          ) : (
            <>
              {filteredNoticesByAmount.slice(0, noticeShowMore.visibleCount).map((n) => (
                <NoticeCard
                  key={n.id}
                  notice={n}
                  onEdit={() => setModal({ type: "notice", editId: n.id })}
                  onDelete={() => deleteNotice(n.id)}
                />
              ))}
              {noticeShowMore.hasMore && (
                <ShowMoreButton onClick={noticeShowMore.showMore} remaining={noticeShowMore.remaining} />
              )}
            </>
          )}
        </Section>
      </main>

      <Footer onExport={handleExport} onImportFile={handleImportFile} />

      {modal?.type === "customer" && (
        <CustomerModal
          initial={editingCustomer}
          latestDeposit={editingCustomerRow?.lastDeposit || null}
          totalDeposits={editingCustomerRow?.totalDeposits || 0}
          onClose={() => setModal(null)}
          onSubmit={(data) => {
            addOrUpdateCustomer(data, modal.editId);
            setModal(null);
          }}
        />
      )}

      {modal?.type === "customerHistory" &&
        (() => {
          const historyCustomer = state.customers.find((c) => c.id === modal.editId);
          if (!historyCustomer) return null;
          const historyDeposits = allDepositsWithPoints.filter((d) => d.customerId === modal.editId);
          return (
            <CustomerHistoryModal
              customer={historyCustomer}
              deposits={historyDeposits}
              onClose={() => setModal(null)}
              onEditDeposit={(depositId) => setModal({ type: "deposit", editId: depositId })}
              onDeleteDeposit={(depositId) => deleteDeposit(depositId)}
            />
          );
        })()}

      {modal?.type === "deposit" && (
        <DepositModal
          customers={state.customers}
          notices={state.notices}
          initial={state.deposits.find((d) => d.id === modal.editId)}
          defaultCustomerId={modal.customerId}
          onClose={() => setModal(null)}
          onSubmit={(data) => {
            addOrUpdateDeposit(data, modal.editId);
            setModal(null);
          }}
          onDelete={
            modal.editId
              ? () => {
                  deleteDeposit(modal.editId);
                  setModal(null);
                }
              : null
          }
        />
      )}

      {modal?.type === "notice" && (
        <NoticeModal
          initial={state.notices.find((n) => n.id === modal.editId)}
          onClose={() => setModal(null)}
          onSubmit={(data) => {
            addOrUpdateNotice(data, modal.editId);
            setModal(null);
          }}
          onDelete={
            modal.editId
              ? () => {
                  deleteNotice(modal.editId);
                  setModal(null);
                }
              : null
          }
        />
      )}

      <Toast message={toast} />

      {filterModal && (
        <DateRangeFilterModal
          title={filterModal === "deposit" ? "فیلتر تاریخ واریزی" : "فیلتر تاریخ ابلاغیه"}
          initial={filterModal === "deposit" ? depositFilter : noticeFilter}
          onClose={() => setFilterModal(null)}
          onApply={(range) => {
            if (filterModal === "deposit") setDepositFilter(range);
            else setNoticeFilter(range);
            setFilterModal(null);
          }}
          onReset={() => {
            if (filterModal === "deposit") setDepositFilter(null);
            else setNoticeFilter(null);
            setFilterModal(null);
          }}
        />
      )}
    </div>
  );
}
