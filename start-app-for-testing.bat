@echo off
echo ========================================
echo Starting Application for Testing
echo ========================================
echo.
echo This will open 2 terminals:
echo   1. Server (port 5000)
echo   2. Client (port 3000)
echo.
echo Wait for both to start, then run tests!
echo.
pause

REM Start server in new window
start "Server - Port 5000" cmd /k "cd server && npm start"

REM Wait a bit
timeout /t 5 /nobreak

REM Start client in new window
start "Client - Port 3000" cmd /k "cd client && npm start"

echo.
echo ========================================
echo Application Starting...
echo ========================================
echo.
echo Wait 30-60 seconds for both to be ready
echo.
echo Server: http://localhost:5000
echo Client: http://localhost:3000
echo.
echo When both are running, run:
echo   run-sell-barrels-tests.bat
echo.
pause
