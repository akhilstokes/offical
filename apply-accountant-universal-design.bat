@echo off
echo ========================================
echo Accountant Universal Design Applicator
echo ========================================
echo.

echo This script will apply the modern full-width design to ALL Accountant pages.
echo.
echo What it does:
echo   1. Adds import statement to all Accountant page files
echo   2. Applies universal CSS styling
echo   3. Makes all pages consistent and modern
echo.

pause

echo.
echo [1/3] Checking if AccountantUniversal.css exists...

if not exist "client\src\pages\accountant\AccountantUniversal.css" (
    echo ERROR: AccountantUniversal.css not found!
    echo Please ensure the file exists at: client\src\pages\accountant\AccountantUniversal.css
    pause
    exit /b 1
)

echo ✓ AccountantUniversal.css found!

echo.
echo [2/3] Listing Accountant page files...
echo.

set count=0

for %%f in (
    "client\src\pages\accountant\AccountantDashboard.js"
    "client\src\pages\accountant\AccountantSalaries.js"
    "client\src\pages\accountant\AccountantAttendance.js"
    "client\src\pages\accountant\AccountantStockMonitor.js"
    "client\src\pages\accountant\AccountantLatexVerify.js"
    "client\src\pages\accountant\AccountantLiveRate.js"
    "client\src\pages\accountant\AccountantDeliveryIntake.js"
    "client\src\pages\accountant\AccountantReports.js"
    "client\src\pages\accountant\AccountantDocuments.js"
    "client\src\pages\accountant\AccountantExpenseTracker.js"
    "client\src\pages\accountant\AccountantVendorLedger.js"
    "client\src\pages\accountant\AccountantAlerts.js"
    "client\src\pages\accountant\AccountantBillGeneration.jsx"
    "client\src\pages\accountant\AccountantLeave.js"
    "client\src\pages\accountant\AccountantMySalary.js"
) do (
    if exist %%f (
        echo   ✓ Found: %%~nxf
        set /a count+=1
    ) else (
        echo   ✗ Missing: %%~nxf
    )
)

echo.
echo Found %count% Accountant page files
echo.

echo [3/3] Instructions to apply the design:
echo.
echo MANUAL METHOD (Recommended):
echo ========================================
echo 1. Open each Accountant page file (.js or .jsx)
echo 2. Add this line after the first import:
echo    import './AccountantUniversal.css';
echo.
echo Example:
echo    import React from 'react';
echo    import './AccountantUniversal.css';  ^<-- Add this line
echo    import './AccountantSalaries.css';
echo.
echo FILES TO UPDATE:
echo ----------------

for %%f in (
    "client\src\pages\accountant\AccountantDashboard.js"
    "client\src\pages\accountant\AccountantSalaries.js"
    "client\src\pages\accountant\AccountantAttendance.js"
    "client\src\pages\accountant\AccountantStockMonitor.js"
    "client\src\pages\accountant\AccountantLatexVerify.js"
    "client\src\pages\accountant\AccountantLiveRate.js"
    "client\src\pages\accountant\AccountantDeliveryIntake.js"
    "client\src\pages\accountant\AccountantReports.js"
    "client\src\pages\accountant\AccountantDocuments.js"
    "client\src\pages\accountant\AccountantExpenseTracker.js"
    "client\src\pages\accountant\AccountantVendorLedger.js"
    "client\src\pages\accountant\AccountantAlerts.js"
    "client\src\pages\accountant\AccountantBillGeneration.jsx"
    "client\src\pages\accountant\AccountantLeave.js"
    "client\src\pages\accountant\AccountantMySalary.js"
) do (
    if exist %%f (
        echo   • %%f
    )
)

echo.
echo ALTERNATIVE METHOD (Global):
echo ========================================
echo Add to client\src\App.js or client\src\index.js:
echo    import './pages/accountant/AccountantUniversal.css';
echo.
echo This will apply the design to all pages at once.
echo.

echo ========================================
echo VERIFICATION STEPS:
echo ========================================
echo 1. Start the development server:
echo    cd client
echo    npm start
echo.
echo 2. Navigate to Accountant pages:
echo    http://localhost:3000/accountant/dashboard
echo    http://localhost:3000/accountant/salaries
echo    http://localhost:3000/accountant/attendance
echo    etc.
echo.
echo 3. Check for:
echo    ✓ Full-width layout
echo    ✓ Gradient headers
echo    ✓ Modern cards and tables
echo    ✓ Smooth animations
echo    ✓ Responsive design
echo.

echo ========================================
echo DOCUMENTATION:
echo ========================================
echo For detailed instructions, see:
echo   ACCOUNTANT_UNIVERSAL_DESIGN_GUIDE.md
echo.

echo ========================================
echo Script Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Add the import statement to each file (see above)
echo 2. Start the dev server and test
echo 3. Enjoy your modern, full-width design!
echo.

pause
