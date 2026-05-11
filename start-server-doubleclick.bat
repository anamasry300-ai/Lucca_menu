@echo off
cd /d "%~dp0server"
start "" /B node server.js
timeout /t 2 /nobreak >nul
echo ✅ السيرفر يعمل في الخلفية
echo.
echo افتح:
echo   http://localhost:3000
echo.
echo اضغط R لفتح المتصفح، أو أي مفتاح للإغلاق
choice /c R /n /t 10 /d R >nul
if errorlevel 1 (
    start http://localhost:3000
    echo تم فتح المتصفح، السيرفر مستمر في العمل...
    echo لإيقافه: taskkill /f /im node.exe
    pause
)
