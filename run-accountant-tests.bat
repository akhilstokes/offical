@echo off
echo ========================================
echo Accountant CRUD Tests - Execution Script
echo ========================================
echo.

echo [1/4] Checking if server is running...
curl -s http://localhost:5000 >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Server is not running on port 5000
    echo Please start the server first: cd server ^&^& npm start
    pause
    exit /b 1
)
echo ✓ Server is running

echo.
echo [2/4] Checking if client is running...
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Client is not running on port 3000
    echo Please start the client first: cd client ^&^& npm start
    pause
    exit /b 1
)
echo ✓ Client is running

echo.
echo [3/4] Running Playwright tests...
echo.
call npx playwright test tests/e2e/accountant-crud.spec.js --reporter=html,list

if %errorlevel% neq 0 (
    echo.
    echo ⚠ Some tests failed. Check the report for details.
) else (
    echo.
    echo ✓ All tests passed!
)

echo.
echo [4/4] Generating custom test report...
call node tests/e2e/generate-accountant-report.js

echo.
echo ========================================
echo Test Execution Complete!
echo ========================================
echo.
echo View Reports:
echo   - Playwright Report: playwright-report\index.html
echo   - Custom Report: playwright-report\accountant-test-report.html
echo.
echo To view Playwright report, run: npm run test:report
echo.

pause
