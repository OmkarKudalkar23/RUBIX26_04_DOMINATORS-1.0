@echo off
echo ========================================
echo Starting Mumbai Hacks Backend Server
echo ========================================
echo.

cd /d "%~dp0"

echo Checking if port 5000 is in use...
netstat -ano | findstr :5000 >nul
if %errorlevel% == 0 (
    echo.
    echo WARNING: Port 5000 is already in use!
    echo Please stop the existing server first (Ctrl+C in its window)
    echo.
    pause
    exit /b 1
)

echo.
echo Starting server...
echo.
node server.js

pause


