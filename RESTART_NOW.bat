@echo off
echo ========================================
echo RESTARTING SERVER - All Routes Fixed
echo ========================================
echo.

echo Stopping all Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Starting backend server...
cd server
start "Backend Server" cmd /k "node server.js"
cd ..

echo.
echo ========================================
echo Server is starting...
echo ========================================
echo.
echo Wait 5-10 seconds for the server to fully start
echo Then refresh your browser pages
echo.
echo All these routes are now available:
echo  - /api/user-management/staff
echo  - /api/staff-invite/*
echo  - /api/barrel-management/*
echo  - /api/workers/*
echo  - /api/attendance/*
echo  - And 30+ more...
echo.
pause
