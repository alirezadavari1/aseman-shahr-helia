import React from "react";
import { Icon } from "./Icons";
import { formatJalali } from "../utils/dateUtils";
import logo from "../assets/logo.png";

export function Header({ clock, todayJalali }) {
  return (
    <header className="app-header">
      <div className="brand-row">
        <div className="brand-mark">
          <img src={logo} alt="لوگو" className="brand-logo-img" />
        </div>
        <div>
          <h1 className="brand-title">شرکت تعاونی آسمان شهر هلیا</h1>
          <p className="brand-sub">سامانه مدیریت مشتریان و واریزی‌ها</p>
        </div>
      </div>
      <div className="date-time-box">
        <div className="dt-row">
          <Icon.clock color="#7a6a8f" />
          <span className="dt-clock">{clock}</span>
          <span className="dt-tz">به وقت تهران</span>
        </div>
        <div className="dt-row">
          <span className="dt-jalali">{formatJalali(...todayJalali)}</span>
        </div>
      </div>
    </header>
  );
}
