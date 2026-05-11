@echo off
title Lucca Caffe - Online
cd /d "%~dp0"

echo ===========================================
echo    ☕ Lucca Caffe - Starting Server
echo ===========================================
echo.

:: Kill old processes
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im ssh.exe >nul 2>&1
timeout /t 2 /nobreak >nul

:: Start server
start "Lucca Server" /B cmd /c "cd /d server && node server.js"

:: Wait for server to start
timeout /t 3 /nobreak >nul

:: Start tunnel
echo Starting tunnel to serveo.net...
start "Lucca Tunnel" /B cmd /c "cd /d server && node tunnel-serveo.js"

:: Wait for tunnel URL
echo Waiting for public URL...
set /a count=0
:waitloop
if exist "server\tunnel-url.txt" goto goturl
timeout /t 1 /nobreak >nul
set /a count+=1
if %count% leq 15 goto waitloop

:goturl
if exist "server\tunnel-url.txt" (
    set /p url=<"server\tunnel-url.txt"
    echo.
    echo ===========================================
    echo    🌐  Public URL: %url%
    echo    📋  Menu:       %url%/menu/index.html
    echo    🔐  Admin:      %url%/login.html
    echo ===========================================
    echo.
    echo Press any key to close server...
) else (
    echo Tunnel not connected yet. Check the tunnel window.
)

pause >nul
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im ssh.exe >nul 2>&1
