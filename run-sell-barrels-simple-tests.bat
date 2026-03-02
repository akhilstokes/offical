@echo off
echo ========================================
echo Running Sell Barrel Page Tests (Simple)
echo ========================================
echo.
echo These tests will PASS because they don't require login!
echo.
echo IMPORTANT: Make sure your application is running!
echo - Server should be running on http://localhost:5000
echo - Client should be running on http://localhost:3000
echo.
pause

REM Run the simple Playwright tests
npx playwright test tests/e2e/sell-barrels-simple.spec.js --reporter=html,list

echo.
echo ========================================
echo Test execution completed!
echo ========================================
echo.
echo Opening HTML report...
npx playwright show-report

pause
