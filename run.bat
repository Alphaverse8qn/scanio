@echo off
setlocal
echo.
echo   ____                  _                 ______  _  __
echo  / ___^|  ___ __ _ _ __ (_) ___           ^| __ ) ^\ ^|/ /
echo  ^\___ ^\ / __/ _` ^| '_ ^\ ^| ^|/ _ ^\   _____  ^|  _ ^\^ \ ' / 
echo  ___) ^| (_^| (_^| ^| ^| ^| ^| ^| ^| (_) ^| ^|_____^| ^| ^|_) / / . ^\ 
echo ^|____/ ^\___\__,_|_^| ^|_^|_^|^\___/          ^|____/_/|_^|^\_\
echo.
echo Built @beauttah
echo.

:: Check for Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install it to continue.
    pause
    exit /b
)

set /p clean="Clear Expo cache before starting? (y/n): "

echo.
echo Installing dependencies...
call npm install

if /I "%clean%"=="y" (
    echo Clearing cache and starting Expo...
    call npx expo start -c
) else (
    echo Starting Expo...
    call npx expo start
)

pause