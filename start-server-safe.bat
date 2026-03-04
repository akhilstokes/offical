@echo off
echo ========================================
echo Starting Server in Safe Mode
echo ========================================
echo.
echo This will show which routes load successfully
echo and which ones have missing dependencies.
echo.

cd server
node server-safe.js

pause
