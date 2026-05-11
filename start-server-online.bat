@echo off
title Lucca Caffe Server + Public Tunnel
cd /d "%~dp0server"

echo ========================================
echo   Lucca Caffe - Server + Internet
echo ========================================
echo.

REM Kill any existing node processes for this server
taskkill /f /im node.exe 2>nul
timeout /t 1 /nobreak >nul

start "LuccaServer" /B /MIN node server.js --tunnel

timeout /t 4 /nobreak >nul

echo ✅ السيرفر شغال على:
echo    محلي:    http://localhost:3000
echo.
echo 🌐 الرابط العام (من أي جهاز في العالم):
echo    (يظهر في نافذة السيرفر)
echo.
echo ========================================
echo 📋 لوحة التحكم:  http://localhost:3000/admin/admin.html
echo 📋 المنيو:       http://localhost:3000/menu/index.html
echo ========================================
echo.
echo 🔴 عشان توقف السيرفر: taskkill /f /im node.exe
echo.
pause
