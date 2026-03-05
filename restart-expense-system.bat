@echo off
echo ========================================
echo  RESTARTING EXPENSE MANAGEMENT SYSTEM
echo ========================================
echo.
echo This will restart both frontend and backend servers
echo to apply the new Expense Management form changes.
echo.
echo Changes applied:
echo - Fixed .env merge conflict
echo - Removed duplicate import in App.js
echo - New form with Items (Name, Rate, Quantity)
echo - Auto-calculation (Subtotal + GST)
echo - No Party Name field
echo.
pause

echo.
echo [1/2] Starting Backend Server...
echo.
cd server
start cmd /k "npm start"
timeout /t 3 /nobreak >nul

echo.
echo [2/2] Starting Frontend Server...
echo.
cd ..
cd client
start cmd /k "npm start"

echo.
echo ========================================
echo  SERVERS STARTING...
echo ========================================
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo IMPORTANT: After frontend loads, do a HARD REFRESH:
echo Press: Ctrl + Shift + R  (or Ctrl + F5)
echo.
echo This will clear the cache and load the new form!
echo.
echo Navigate to: Admin Dashboard ^> Operations ^> Expenses
echo.
pause
