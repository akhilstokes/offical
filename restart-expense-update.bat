@echo off
echo ========================================
echo   RESTARTING WITH EXPENSE UPDATES
echo ========================================
echo.

echo Stopping any running processes...
taskkill /F /IM node.exe 2>nul

echo.
echo Clearing client build cache...
cd client
if exist build rmdir /s /q build
if exist node_modules\.cache rmdir /s /q node_modules\.cache

echo.
echo Starting backend server...
cd ..\server
start "Backend Server" cmd /k "npm start"

timeout /t 3

echo.
echo Starting frontend client...
cd ..\client
start "Frontend Client" cmd /k "npm start"

echo.
echo ========================================
echo   SERVERS STARTING
echo ========================================
echo.
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5000
echo.
echo Wait for both servers to start, then:
echo 1. Open http://localhost:5000 in your browser
echo 2. Press Ctrl+Shift+R to hard refresh
echo 3. Login and navigate to Expenses
echo.
pause
