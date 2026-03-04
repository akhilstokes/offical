@echo off
echo ========================================
echo Restarting Application with Routing Fix
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
echo Step 3: Building React app...
cd client
call npm run build
echo.

echo Step 4: Starting frontend with proper routing...
start "Frontend Server" cmd /k "npm run serve"
cd ..

echo.
echo ========================================
echo Application started successfully!
echo ========================================
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Admin pages should now work:
echo - http://localhost:3000/admin/attendance
echo - http://localhost:3000/admin/worker-documents
echo - http://localhost:3000/admin/worker-schedule
echo - http://localhost:3000/admin/staff-management
echo - http://localhost:3000/admin/staff
echo.
echo Press any key to exit this window...
pause >nul
