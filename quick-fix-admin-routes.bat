@echo off
echo ========================================
echo Quick Fix: Admin Routes
echo ========================================
echo.

echo Stopping all Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Starting backend server...
cd server
start "Backend" cmd /k "node server.js"
cd ..
timeout /t 3 /nobreak >nul

echo.
echo Rebuilding and starting frontend with routing fix...
cd client
call npm run build
start "Frontend" cmd /k "serve -s build -l 3000 --single"
cd ..

echo.
echo ========================================
echo DONE! Testing in 5 seconds...
echo ========================================
timeout /t 5 /nobreak >nul

echo.
echo Opening test URLs...
start http://localhost:3000/admin/attendance
timeout /t 1 /nobreak >nul
start http://localhost:3000/admin/worker-documents
timeout /t 1 /nobreak >nul
start http://localhost:3000/admin/worker-schedule
timeout /t 1 /nobreak >nul
start http://localhost:3000/admin/staff-management
timeout /t 1 /nobreak >nul
start http://localhost:3000/admin/staff

echo.
echo All admin pages should now load with status 200!
echo.
pause
