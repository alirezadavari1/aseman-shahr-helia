; اسکریپت سفارشی نصاب: بررسی می‌کند آیا Universal C Runtime (UCRT) روی سیستم هست یا نه.
; روی ویندوز ۷ بدون آپدیت، این فایل‌ها معمولاً وجود ندارند و باعث می‌شوند برنامه
; اصلاً باز نشود (خطای DLL گم‌شده). این ماکرو، در صورت نبود آن، بسته‌ی رسمی
; Microsoft Visual C++ Redistributable را (که شامل UCRT هم هست) به‌صورت خودکار
; و بی‌صدا از سایت مایکروسافت دانلود و نصب می‌کند.

!macro customInit
  IfFileExists "$SYSDIR\ucrtbase.dll" ucrt_present
    DetailPrint "در حال نصب یک مؤلفه‌ی ضروری ویندوز (Universal C Runtime)..."
    NSISdl::download "https://aka.ms/vs/17/release/vc_redist.x64.exe" "$TEMP\vc_redist.x64.exe"
    Pop $0
    StrCmp $0 "success" 0 ucrt_download_failed
      ExecWait '"$TEMP\vc_redist.x64.exe" /install /quiet /norestart'
      Goto ucrt_present
    ucrt_download_failed:
      MessageBox MB_OK|MB_ICONEXCLAMATION "اتصال اینترنت برای نصب یک مؤلفه‌ی ضروری ویندوز برقرار نشد.$\r$\nنصب برنامه ادامه می‌یابد، ولی اگر بعداً برنامه باز نشد، لطفاً Visual C++ Redistributable را از سایت مایکروسافت (aka.ms/vs/17/release/vc_redist.x64.exe) نصب کنید."
  ucrt_present:
!macroend
