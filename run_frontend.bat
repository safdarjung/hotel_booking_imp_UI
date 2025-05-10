@echo off
echo ===================================
echo Hotel Booking Application - Frontend
echo ===================================
echo.

REM Check if Node.js is installed
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is not installed or not in PATH. Please install Node.js and try again.
    exit /b 1
)

REM Change to frontend directory and start the development server
echo Starting frontend...
cd frontend
npm run dev

echo.
echo Frontend stopped.
echo. 