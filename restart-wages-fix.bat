@echo off
echo ========================================
echo   RESTARTING SERVER WITH WAGES FIX
echo ========================================
echo.

echo Stopping any running servers...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Starting server...
cd server
start "Backend Server" cmd /k "node server.js"

echo.
echo Waiting for server to start...
timeout /t 5 /nobreak >nul

echo.
echo Starting client...
cd ../client
start "React Client" cmd /k "npm start"

echo.
echo ========================================
echo   SERVERS STARTED!
echo ========================================
echo   Backend: http://localhost:5000
echo   Frontend: http://localhost:3000
echo ========================================
echo.
pause
