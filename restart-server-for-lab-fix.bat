@echo off
echo ========================================
echo Restarting Server with Lab Workflow Fix
echo ========================================
echo.

echo Stopping all Node.js processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Starting backend server with updated code...
cd server
start "Backend Server - Lab Fix" cmd /k "node server.js"
cd ..

echo.
echo Server is starting...
echo Wait 5 seconds, then test the workflow:
echo.
echo 1. Go to Delivery Dashboard as jojo2001p@gmail.com
echo 2. Mark a delivery as "Delivered to Lab"
echo 3. Go to Lab Dashboard as akhil@gmail.com
echo 4. Check Incoming Requests - new item should appear!
echo.
echo ========================================
pause
