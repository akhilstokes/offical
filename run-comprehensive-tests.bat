@echo off
echo ========================================
echo  Comprehensive Testing Suite
echo  Holy Family Polymers - Rubber Management System
echo ========================================
echo.

echo [1/3] Running Playwright Tests...
echo.
call npx playwright test --reporter=html,json

echo.
echo [2/3] Generating Comprehensive Report...
echo.
call node tests/e2e/generate-comprehensive-report.js

echo.
echo [3/3] Opening Reports...
echo.

REM Open the comprehensive report
if exist "COMPREHENSIVE_TEST_REPORT.html" (
    echo Opening Comprehensive Test Report...
    start COMPREHENSIVE_TEST_REPORT.html
)

REM Open Playwright HTML report
if exist "playwright-report\index.html" (
    echo Opening Playwright HTML Report...
    call npx playwright show-report
)

echo.
echo ========================================
echo  Testing Complete!
echo ========================================
echo.
echo Reports generated:
echo  - COMPREHENSIVE_TEST_REPORT.html
echo  - playwright-report/index.html
echo.
pause
