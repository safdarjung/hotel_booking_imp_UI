# Hotel Booking Application - Batch Scripts

This directory contains Windows batch scripts to easily set up and run the Hotel Booking Application with a Python virtual environment.

## Available Scripts

### `setup.bat`

Sets up everything you need to run the application:
- Creates a Python virtual environment
- Installs backend dependencies
- Installs frontend dependencies
- Creates template .env files for configuration

**Run this script first before trying to run the application.**

### `run.bat`

Runs both the backend and frontend in separate command prompt windows:
- Activates the virtual environment
- Starts the Flask backend server
- Starts the React frontend development server

This is the primary script for running the complete application.

### `run_backend.bat`

Runs only the backend server:
- Activates the virtual environment
- Starts the Flask backend server

Use this if you only need to work with the backend API.

### `run_frontend.bat`

Runs only the frontend development server:
- Starts the React frontend development server

Use this if you already have the backend running and only need to start the frontend.

## Prerequisites

- Python 3.7 or higher
- Node.js and npm
- Windows operating system

## Getting Started

1. **Set up the application**:
   ```
   setup.bat
   ```

2. **Edit the environment files**:
   - Edit `.env` in the root directory to add your actual API keys
   - Edit `frontend\.env` if necessary to change frontend configuration

3. **Run the application**:
   ```
   run.bat
   ```

4. **Access the application**:
   - Backend API: http://localhost:5000
   - Frontend: http://localhost:8080

## Troubleshooting

- If you see an error about Python or Node.js not being found, ensure they are installed and added to your PATH environment variable.
- If setup fails with dependency errors, check your internet connection and try running `setup.bat` again.
- If the backend fails to start, check the `.env` file in the root directory for correct API keys.
- If the frontend fails to start, ensure all frontend dependencies were properly installed during setup. 