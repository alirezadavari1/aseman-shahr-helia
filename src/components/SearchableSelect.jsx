import React, { useState, useRef, useEffect } from "react";
import { Icon } from "./Icons";

/**
 * کمبوباکس قابل‌جستجو: مثل یک select معمولی عمل می‌کند ولی امکان تایپ و فیلترکردن
 * دقیق (substring match) بین گزینه‌ها را هم می‌دهد. برای انتخاب مشتری یا ابلاغیه در فرم واریزی.
 *
 * options: [{ id, label }]
 * value: id انتخاب‌شده یا "" / null
 */
export function SearchableSelect({ options, value, onChange, placeholder, emptyText = "موردی یافت نشد" }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const selected = options.find((o) => o.id === value) || null;

  useEffect(() => {
    const onClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const filtered = query.trim()
    ? options.filter((o) => o.label.includes(query.trim()))
    : options;

  const selectOption = (id) => {
    onChange(id);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="searchable-select" ref={wrapRef}>
      <div
        className="searchable-select-input-wrap"
        onMouseDown={(e) => {
          // جلوگیری از رقابت با رویداد mousedown خارج از کامپوننت که ممکن است دراپ‌داون را زودتر ببندد
          if (e.target === e.currentTarget) e.preventDefault();
          setOpen(true);
        }}
      >
        <Icon.search className="search-icon" />
        <input
          className="searchable-select-input"
          type="text"
          value={open ? query : selected ? selected.label : ""}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
        />
        {selected && !open && (
          <button
            type="button"
            className="searchable-select-clear"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            title="پاک کردن"
          >
            <Icon.close />
          </button>
        )}
      </div>

      {open && (
        <div className="searchable-select-dropdown">
          {filtered.length === 0 ? (
            <div className="searchable-select-empty">{emptyText}</div>
          ) : (
            filtered.map((o) => (
              <div
                key={o.id}
                className={`searchable-select-option ${o.id === value ? "active" : ""}`}
                // از onMouseDown به‌جای onClick استفاده می‌شود تا قبل از هر بسته‌شدن احتمالی
                // دراپ‌داون (مثلاً به‌خاطر blur یا رویدادهای بیرونی)، انتخاب با قطعیت ثبت شود.
                onMouseDown={(e) => {
                  e.preventDefault();
                  selectOption(o.id);
                }}
              >
                {o.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
