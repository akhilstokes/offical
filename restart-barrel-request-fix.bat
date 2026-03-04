@echo off
echo ========================================
echo  RESTARTING SERVER WITH BARREL REQUEST FIX
echo ========================================
echo.
echo Changes applied:
echo  1. Updated barrel request approve endpoint to return APPROVED status
echo  2. Added assign endpoint for barrel requests
echo  3. Updated barrel request model with new fields
echo  4. Fixed DeliveryIntake validation error on partial updates
echo.
echo Stopping any running servers...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Starting server...
cd server
start "HFP Server" cmd /k "npm start"

echo.
echo ========================================
echo  SERVER RESTARTED SUCCESSFULLY
echo ========================================
echo.
echo The server is now running with the barrel request fixes.
echo.
echo NEXT STEPS:
echo  1. Refresh the Manager Sell Requests page
echo  2. Try approving a BARREL request
echo  3. The Assign Staff button should unlock after approval
echo  4. Assign delivery staff to the approved request
echo.
pause
