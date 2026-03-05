@echo off
echo ========================================
echo  RESTARTING BACKEND SERVER
echo ========================================
echo.
echo Fixes applied:
echo - Updated Expense model with items, gstEnabled, gstAmount
echo - Fixed CORS configuration
echo - Added debug logging
echo.
echo Stopping any running backend servers...
taskkill /F /FI "WINDOWTITLE eq *server*npm*" 2>nul
taskkill /F /FI "WINDOWTITLE eq Administrator*server*" 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Starting backend server...
cd server
start "Backend Server" cmd /k "npm start"

echo.
echo ========================================
echo  BACKEND SERVER STARTING...
echo ========================================
echo.
echo Wait for the message: "Server running on port 5000"
echo.
echo Then in your browser:
echo 1. Go to: http://localhost:3000/admin/expenses
echo 2. Hard refresh: Ctrl + Shift + R
echo 3. Click "+ Create Expense"
echo 4. Fill the form and submit
echo.
echo The CORS error should be fixed!
echo.
pause
