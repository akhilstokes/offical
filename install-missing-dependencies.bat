@echo off
echo ========================================
echo Installing Missing Dependencies
echo ========================================
echo.

echo Installing server dependencies...
cd server
call npm install qrcode
echo.

echo Checking for other common missing packages...
call npm install --save express mongoose dotenv cors bcryptjs jsonwebtoken
call npm install --save multer nodemailer axios cheerio node-cron
call npm install --save qrcode uuid moment

echo.
echo ========================================
echo Dependencies installed!
echo ========================================
echo.
echo Now you can start the server with:
echo   cd server
echo   node server.js
echo.
pause
