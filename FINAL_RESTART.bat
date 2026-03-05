@echo off
cls
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║           🚀 FINAL FIX - RESTARTING BACKEND                   ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo ✅ CORS Fix Applied:
echo    - Now allows ALL localhost origins
echo    - No more CORS errors!
echo.
echo ✅ Expense Model Fixed:
echo    - Added items, gstEnabled, gstAmount, totalAmount
echo.
echo ✅ Controller Logging Added:
echo    - Will show detailed debug info
echo.
pause

echo.
echo [1/2] Stopping backend server...
taskkill /F /FI "WINDOWTITLE eq *Backend Server*" 2>nul
taskkill /F /FI "WINDOWTITLE eq *server*npm*" 2>nul
timeout /t 2 /nobreak >nul

echo.
echo [2/2] Starting backend server...
cd server
start "Backend Server" cmd /k "echo Starting backend... && npm start"

echo.
echo ╔═══════════════════════════════════════════════════════════════╗
echo ║                                                               ║
echo ║           ✅ BACKEND RESTARTING...                            ║
echo ║                                                               ║
echo ╚═══════════════════════════════════════════════════════════════╝
echo.
echo Wait for: "Server running on port 5000"
echo.
echo Then test the expense form:
echo 1. Go to: http://localhost:3000/admin/expenses
echo 2. Click "+ Create Expense"
echo 3. Fill the form
echo 4. Click "Create Expense"
echo 5. Should work! ✅
echo.
echo The backend will show detailed logs if there are any issues.
echo.
pause
