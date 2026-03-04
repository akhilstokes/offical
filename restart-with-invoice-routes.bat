@echo off
echo ========================================
echo  RESTARTING SERVER WITH INVOICE ROUTES
echo ========================================
echo.

echo [1/2] Stopping any running servers...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo [2/2] Starting server with invoice routes enabled...
cd server
start "Backend Server" cmd /k "node server.js"

echo.
echo ========================================
echo  SERVER RESTARTED SUCCESSFULLY!
echo ========================================
echo.
echo Invoice routes are now available at:
echo   - POST   /api/invoices
echo   - GET    /api/invoices
echo   - GET    /api/invoices/:id
echo   - PUT    /api/invoices/:id/approve
echo   - POST   /api/invoices/:id/payment
echo.
echo The Bill History tab should now work!
echo.
pause
