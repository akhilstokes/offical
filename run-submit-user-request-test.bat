@echo off
echo ========================================
echo Submit User Request - Playwright Test
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [ERROR] node_modules not found!
    echo Please run: npm install
    pause
    exit /b 1
)

echo [INFO] Starting Submit User Request test...
echo.

REM Run the specific test
npx playwright test tests/e2e/submit-user-request.spec.js --reporter=list,html

echo.
echo ========================================
echo Test execution completed!
echo ========================================
echo.
echo To view the HTML report, run:
echo npx playwright show-report
echo.
pause
