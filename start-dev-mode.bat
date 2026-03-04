@echo off
echo ========================================
echo Starting Application in Development Mode
echo ========================================
echo.

echo Step 1: Stopping all Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Step 2: Starting backend server...
cd server
start "Backend Server" cmd /k "node server.js"
cd ..
timeout /t 3 /nobreak >nul

echo.
echo Step 3: Starting React development server...
cd client
start "React Dev Server" cmd /k "npm start"
cd ..

echo.
echo ========================================
echo Development servers starting...
echo ========================================
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000 (will open automatically)
echo.
echo All admin routes will work correctly in dev mode!
echo.
echo Press any key to exit this window...
pause >nul
