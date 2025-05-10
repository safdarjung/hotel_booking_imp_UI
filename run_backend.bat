@echo off
echo ===================================
echo Hotel Booking Application - Backend
echo ===================================
echo.

REM Check if virtual environment exists
if not exist "venv\" (
    echo Virtual environment not found. Please run setup.bat first.
    exit /b 1
)

REM Activate virtual environment and run backend
echo Starting backend...
call venv\Scripts\activate
python api.py

echo.
echo Backend stopped.
echo. 