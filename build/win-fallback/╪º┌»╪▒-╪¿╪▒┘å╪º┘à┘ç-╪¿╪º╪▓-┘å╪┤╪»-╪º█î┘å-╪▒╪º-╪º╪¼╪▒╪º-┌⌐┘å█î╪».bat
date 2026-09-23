@echo off
echo ============================================================
echo   RUN THIS ONLY IF THE APP DOES NOT OPEN (missing DLL error)
echo   This installs one required Windows component
echo   (Microsoft Visual C++ / Universal C Runtime) from the
echo   official Microsoft website. Needs internet, one-time only.
echo ============================================================
echo.
pause
echo Downloading...
powershell -Command "Invoke-WebRequest -Uri 'https://aka.ms/vs/17/release/vc_redist.x64.exe' -OutFile '%TEMP%\vc_redist.x64.exe'"
if exist "%TEMP%\vc_redist.x64.exe" (
  echo Installing...
  "%TEMP%\vc_redist.x64.exe" /install /passive /norestart
  echo.
  echo Done. Now run AsemanShahrHelia.exe again.
) else (
  echo Download failed. Please check your internet connection, or
  echo download and install this file manually:
  echo https://aka.ms/vs/17/release/vc_redist.x64.exe
)
pause
