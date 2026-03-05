@echo off
echo ========================================
echo   FIXING EXPENSE DATABASE INDEXES
echo ========================================
echo.

cd server
node fix-expense-indexes.js

echo.
echo ========================================
echo   FIX COMPLETE
echo ========================================
echo.
echo Now restart your server and try creating an expense again.
echo.
pause
