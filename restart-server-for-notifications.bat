@echo off
echo ========================================
echo Restarting Server with Notifications Fix
echo ========================================
echo.

echo Stopping existing server...
taskkill /F /PID 17816 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Starting server...
cd server
start "HFP Server" cmd /k "node server.js"

echo.
echo Waiting for server to start...
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo Server restarted successfully!
echo ========================================
echo.
echo The bulk-notifications routes are now available.
echo You can now use the Manager Notifications page.
echo.
pause
