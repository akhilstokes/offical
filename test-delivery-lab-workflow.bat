@echo off
echo ========================================
echo Restarting Server and Testing Delivery to Lab Workflow
echo ========================================
echo.

echo Step 1: Stopping any running servers...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Step 2: Starting backend server...
cd server
start "Backend Server" cmd /k "node server.js"
cd ..

echo.
echo Waiting 5 seconds for server to start...
timeout /t 5 /nobreak >nul

echo.
echo Step 3: Running delivery to lab workflow test...
node test-delivery-to-lab-flow.js

echo.
echo ========================================
echo Test Complete!
echo ========================================
echo.
echo The server is still running in the background.
echo Check the test results above.
echo.
pause
