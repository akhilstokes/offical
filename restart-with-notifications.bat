@echo off
echo ========================================
echo Restarting Server with Notifications
echo ========================================
echo.

cd server

echo Stopping any running server...
taskkill /F /IM node.exe 2>nul

echo.
echo Starting server with notification routes...
start cmd /k "npm start"

echo.
echo Server is starting...
echo Wait 5 seconds for server to fully start
timeout /t 5 /nobreak >nul

echo.
echo ========================================
echo Server restarted successfully!
echo ========================================
echo.
echo The notification broadcast endpoint is now available at:
echo http://localhost:5000/api/notifications/broadcast
echo.
echo You can now use the Admin Notifications page.
echo.
pause
