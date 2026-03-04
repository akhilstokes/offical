@echo off
echo ========================================
echo   RESTARTING BACKEND SERVER
echo ========================================
echo.

echo Stopping backend server...
taskkill /F /FI "WINDOWTITLE eq Backend Server*" 2>nul
taskkill /F /FI "CommandLine eq *node*server.js*" 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Starting backend server...
cd server
start "Backend Server" cmd /k "node server.js"

echo.
echo ========================================
echo   BACKEND SERVER RESTARTED!
echo ========================================
echo   Backend: http://localhost:5000
echo ========================================
echo.
echo The frontend should automatically reconnect.
echo.
pause
