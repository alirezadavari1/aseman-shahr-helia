import React, { useRef } from "react";
import { Icon } from "./Icons";
import { isElectron } from "../utils/storage";
import logo from "../assets/logo.png";

export function Footer({ onExport, onImportFile }) {
  const fileInputRef = useRef(null);

  const handleImportClick = () => {
    if (isElectron()) {
      // در دسکتاپ نیازی به input فایل مرورگر نیست؛ پنجره‌ی بومی ویندوز خودش باز می‌شود
      onImportFile(null);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onImportFile(file);
    e.target.value = ""; // امکان انتخاب دوباره‌ی همان فایل
  };

  return (
    <footer className="app-footer">
      <div className="footer-brand">
        <div className="footer-logo">
          <img src={logo} alt="لوگو" className="footer-logo-img" />
        </div>
        <span className="footer-name">شرکت تعاونی آسمان شهر هلیا</span>
      </div>

      <div className="footer-actions">
        <button className="footer-btn" onClick={onExport} title="ذخیره‌ی فایل پشتیبان JSON">
          <Icon.download />
          خروجی گرفتن (Export)
        </button>
        <button className="footer-btn" onClick={handleImportClick} title="بارگذاری فایل پشتیبان JSON">
          <Icon.upload />
          وارد کردن (Import)
        </button>
        {!isElectron() && (
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        )}
      </div>
    </footer>
  );
}
