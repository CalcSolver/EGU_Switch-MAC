@echo off
echo Cleaning old builds...
rd /s /q node_modules package-lock.json
echo Installing dependencies...
call npm install
echo --------------------------------------
echo ✅ Windows Setup Complete!
echo --------------------------------------
pause
