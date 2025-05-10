@echo off
echo ===================================
echo Hotel Booking Application - Run
echo ===================================
echo.

REM Check if virtual environment exists
if not exist "venv\" (
    echo Virtual environment not found. Please run setup.bat first.
    exit /b 1
)

REM Check if Node.js is installed
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is not installed or not in PATH. Please install Node.js and try again.
    exit /b 1
)

REM Start backend and frontend in separate windows
echo Starting the application...

REM Start backend in a new Command Prompt window
echo Starting backend...
start "Hotel Booking Backend" cmd /k "call venv\Scripts\activate && python api.py"

REM Give the backend a moment to start
timeout /t 3 /nobreak >nul

REM Start frontend in a new Command Prompt window
echo Starting frontend...
start "Hotel Booking Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================
echo Application started successfully!
echo ===================================
echo.
echo Backend running at: http://localhost:5000
echo Frontend running at: http://localhost:8080
echo.
echo Press Ctrl+C and close the windows to stop the application.
echo. 