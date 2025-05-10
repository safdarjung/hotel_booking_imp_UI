@echo off
echo ===================================
echo Hotel Booking Application - Setup
echo ===================================
echo.

REM Check if Python is installed
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Python is not installed or not in PATH. Please install Python and try again.
    exit /b 1
)

REM Create virtual environment if it doesn't exist
if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to create virtual environment. Please install venv package and try again.
        exit /b 1
    )
    echo Virtual environment created successfully.
) else (
    echo Virtual environment already exists.
)

REM Activate virtual environment and install backend dependencies
echo Installing backend dependencies...
call venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo Failed to install backend dependencies.
    exit /b 1
)
echo Backend dependencies installed successfully.

REM Check if Node.js is installed
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is not installed or not in PATH. Please install Node.js and try again.
    exit /b 1
)

REM Install frontend dependencies
echo Installing frontend dependencies...
cd frontend
npm install
if %ERRORLEVEL% NEQ 0 (
    echo Failed to install frontend dependencies.
    cd ..
    exit /b 1
)
cd ..
echo Frontend dependencies installed successfully.

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo Creating .env file...
    echo SERPAPI_KEY=your_serpapi_key>.env
    echo GROQ_API_KEY=your_groq_api_key>>.env
    echo Created .env file. Please edit it with your actual API keys.
) else (
    echo .env file already exists.
)

REM Create frontend .env file if it doesn't exist
if not exist "frontend\.env" (
    echo Creating frontend .env file...
    echo VITE_API_URL=http://localhost:5000/api>frontend\.env
    echo VITE_APP_TITLE=Hotel Booking App>>frontend\.env
    echo Created frontend .env file.
) else (
    echo Frontend .env file already exists.
)

echo.
echo ===================================
echo Setup completed successfully!
echo ===================================
echo You can now run the application with:
echo   run.bat
echo. 