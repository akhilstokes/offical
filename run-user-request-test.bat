@echo off
echo ========================================
echo User Request Submission Test
echo ========================================
echo.

echo [INFO] Testing user request submission workflow...
echo.

REM Run the user request submission test
npx playwright test tests/e2e/user-request-submission.spec.js --project=chromium --reporter=list,html

echo.
echo ========================================
echo Test completed!
echo ========================================
echo.
echo View the report:
echo npx playwright show-report
echo.
pause
