@echo off
echo ========================================
echo Running User Sell Barrel Page Tests
echo ========================================
echo.
echo IMPORTANT: Make sure your application is running!
echo - Server should be running on http://localhost:5000
echo - Client should be running on http://localhost:3000
echo.
echo If not running, open two terminals:
echo   Terminal 1: cd server ^&^& npm start
echo   Terminal 2: cd client ^&^& npm start
echo.
pause

REM Run the Playwright tests for sell barrels page
npx playwright test tests/e2e/sell-barrels.spec.js --reporter=html,list

echo.
echo ========================================
echo Test execution completed!
echo ========================================
echo.
echo Opening HTML report...
npx playwright show-report

pause
