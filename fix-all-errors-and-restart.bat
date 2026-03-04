@echo off
echo ========================================
echo Fixing All Errors and Restarting
echo ========================================
echo.

echo Step 1: Stopping all Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 3 /nobreak >nul

echo.
echo Step 2: Starting backend server with all routes...
cd server
start "Backend Server" cmd /k "echo Backend Server Starting... && node server.js"
cd ..
timeout /t 5 /nobreak >nul

echo.
echo Step 3: Starting React development server...
cd client
start "React Dev Server" cmd /k "echo React Dev Server Starting... && npm start"
cd ..

echo.
echo ========================================
echo Servers are starting...
echo ========================================
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000 (will open automatically)
echo.
echo Wait for both servers to fully start (about 30 seconds)
echo Then test the admin pages:
echo - http://localhost:3000/admin/attendance
echo - http://localhost:3000/admin/barrel-management
echo - http://localhost:3000/admin/staff-management
echo.
echo All errors should be fixed:
echo  - Barrel Management API will return JSON
echo  - No jsx attribute warnings
echo  - Admin pages will return 200 status
echo.
pause
