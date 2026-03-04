@echo off
echo ========================================
echo FINAL FIX - Starting All Services
echo ========================================
echo.

echo Step 1: Stopping all Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Step 2: Starting backend server (port 5000)...
cd server
start "Backend Server - Port 5000" cmd /k "echo Backend Server Starting... && node server-safe.js"
cd ..
timeout /t 8 /nobreak >nul

echo.
echo Step 3: Starting React development server (port 3000)...
cd client
start "React Dev Server - Port 3000" cmd /k "echo React Dev Server Starting... && npm start"
cd ..

echo.
echo ========================================
echo Services Starting...
echo ========================================
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Wait 30-60 seconds for React to compile...
echo.
echo Then test these URLs:
echo  - http://localhost:3000/admin/attendance
echo  - http://localhost:3000/admin/barrel-management
echo  - http://localhost:3000/admin/staff-management
echo  - http://localhost:3000/admin/worker-schedule
echo  - http://localhost:3000/admin/worker-documents
echo.
echo All errors should be fixed:
echo  ✓ API returns JSON (not HTML)
echo  ✓ No jsx warnings
echo  ✓ All routes return 200 status
echo.
pause
