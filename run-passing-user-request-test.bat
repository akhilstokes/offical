@echo off
echo ========================================
echo Running User Request Submission Tests
echo ========================================
echo.

npx playwright test tests/e2e/submit-user-request-passing.spec.js --reporter=html

echo.
echo ========================================
echo Tests Complete!
echo ========================================
echo.
echo Opening test report...
npx playwright show-report

pause
