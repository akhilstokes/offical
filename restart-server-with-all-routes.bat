@echo off
echo ========================================
echo Restarting Server with All Routes
echo ========================================
echo.

echo Stopping all Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Starting backend server with all routes...
cd server
start "Backend Server - All Routes Enabled" cmd /k "node server.js"
cd ..

echo.
echo ========================================
echo Server restarted successfully!
echo ========================================
echo.
echo Backend: http://localhost:5000
echo.
echo All API routes are now available:
echo - /api/barrel-management/*
echo - /api/workers/*
echo - /api/schedules/*
echo - /api/attendance/*
echo - And many more...
echo.
echo Check the server console for any errors.
echo.
pause
