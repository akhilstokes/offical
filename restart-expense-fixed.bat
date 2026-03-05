@echo off
echo ========================================
echo  EXPENSE SYSTEM - MODEL FIXED
echo ========================================
echo.
echo Fixed: Added items, gstEnabled, gstAmount, totalAmount to Expense model
echo.
echo This will:
echo 1. Test the expense creation
echo 2. Restart backend server
echo 3. Keep frontend running (or start if not running)
echo.
pause

echo.
echo [Step 1] Testing Expense Creation...
echo.
node test-expense-creation.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Test failed! Check the error above.
    pause
    exit /b 1
)

echo.
echo [Step 2] Restarting Backend Server...
echo.
cd server
taskkill /F /FI "WINDOWTITLE eq *npm start*" 2>nul
timeout /t 2 /nobreak >nul
start cmd /k "npm start"
timeout /t 3 /nobreak >nul

echo.
echo [Step 3] Checking Frontend...
echo.
cd ..
cd client
tasklist /FI "WINDOWTITLE eq *npm start*" 2>nul | find /I "node.exe" >nul
if %ERRORLEVEL% NEQ 0 (
    echo Starting frontend...
    start cmd /k "npm start"
) else (
    echo Frontend already running
)

echo.
echo ========================================
echo  SERVERS READY!
echo ========================================
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo IMPORTANT STEPS:
echo 1. Wait for both servers to fully start
echo 2. Open browser: http://localhost:3000
echo 3. HARD REFRESH: Ctrl + Shift + R
echo 4. Login as Admin
echo 5. Go to: Admin ^> Operations ^> Expenses
echo 6. Click "+ Create Expense"
echo 7. Test the form!
echo.
echo The 500 error should now be fixed!
echo.
pause
