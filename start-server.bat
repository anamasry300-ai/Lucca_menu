@echo off
cd /d "%~dp0server"
echo ========================================
echo   Lucca Caffe - تشغيل السيرفر
echo ========================================
echo.
echo جاري تشغيل السيرفر...
echo.
start "" /B node server.js
timeout /t 3 /nobreak >nul
echo.
echo ✅ السيرفر يعمل على:
echo    http://localhost:3000
echo.
echo 📋 لوحة التحكم:    http://localhost:3000/admin/admin.html
echo 📋 المنيو:         http://localhost:3000/menu/index.html
echo.
echo 🔴 أغلقه بالضغط على أي مفتاح...
pause >nul
echo.
echo جاري إيقاف السيرفر...
taskkill /f /im node.exe >nul 2>&1
echo ✅ تم إيقاف السيرفر
pause
