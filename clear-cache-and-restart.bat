@echo off
echo Clearing webpack cache and restarting development server...
echo.

cd client

echo Step 1: Stopping any running processes...
taskkill /F /IM node.exe 2>nul

echo Step 2: Clearing node_modules cache...
if exist node_modules\.cache (
    rmdir /s /q node_modules\.cache
    echo Cache cleared!
) else (
    echo No cache folder found
)

echo Step 3: Clearing build artifacts...
if exist build (
    rmdir /s /q build
    echo Build folder cleared!
)

echo Step 4: Starting fresh development server...
echo.
echo IMPORTANT: After server starts, press Ctrl+Shift+R in your browser to hard refresh!
echo.
start cmd /k "npm start"

cd ..
echo.
echo Done! Wait for server to start, then hard refresh your browser (Ctrl+Shift+R)
pause
