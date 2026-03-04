@echo off
echo Starting Backend Server...
echo.

cd server
start cmd /k "npm start"

cd ..
echo Backend server starting on port 5000...
echo.
pause
