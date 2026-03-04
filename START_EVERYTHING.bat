@echo off
echo ========================================
echo Starting Complete Application
echo ========================================
echo.

echo Stopping any existing Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Starting Backend Server (Port 5000)...
cd server
start "Backend - Port 5000" cmd /k "echo Backend Server && node server.js"
cd ..
timeout /t 5 /nobreak >nul

echo.
echo Starting Frontend (Port 3000)...
cd client
start "Frontend - Port 3000" cmd /k "echo React Dev Server && npm start"
cd ..

echo.
echo ========================================
echo Application Starting...
echo ========================================
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Wait 30-60 seconds for React to compile...
echo Then test: http://localhost:3000/admin/barrel-management
echo.
pause
