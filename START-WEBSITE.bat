@echo off
REM Starts the Dr. Nivedita Dadu preview website on this computer.
REM Keep this window open while you are looking at the site; close it to stop.
title Dr Nivedita Dadu - preview website
cd /d "%~dp0dr-nivedita\local\website"

echo.
echo   Starting the website...
echo.
echo   On this computer:      http://localhost:3000
echo   On phone / other PC:   http://192.168.31.80:3000   (same Wi-Fi only)
echo.
echo   Keep this window open. Close it to stop the website.
echo.

start "" http://localhost:3000
node server.js
pause
