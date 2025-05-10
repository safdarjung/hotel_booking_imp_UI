# Hotel Booking Application - Deployment Guide

This guide provides instructions for setting up and running the Hotel Booking Application (Flask backend and React frontend) on a new machine.

## 1. Prerequisites

Before you begin, ensure you have the following installed:

- **Python:** Version 3.7 or higher.
- **Node.js and npm:** A recent LTS version of Node.js (which includes npm) is recommended.
- **Git:** For cloning the repository.
- **Internet Connection:** Required for downloading dependencies and for the application to fetch data from external APIs.

## 2. Clone the Repository

Open your terminal or command prompt and run:
```bash
git clone <repository-url>  # Replace <repository-url> with the actual URL of the repository
cd hotel-booking-application # Or the name of your project's root folder
```

## 3. Backend Setup

The backend is a Flask application.

### 3.1. Create and Activate Python Virtual Environment
It's highly recommended to use a virtual environment for Python projects.

```bash
# From the project root directory
python -m venv .venv
```

Activate the virtual environment:
-   **Windows (Command Prompt/PowerShell):**
    ```bash
    .\.venv\Scripts\activate
    ```
-   **Linux/macOS (bash/zsh):**
    ```bash
    source .venv/bin/activate
    ```

### 3.2. Install Python Dependencies
With the virtual environment activated, install the required Python packages:

```bash
pip install -r requirements.txt
```

### 3.3. Configure Backend Environment Variables
Create a file named `.env` in the **project root directory**. Add your API keys to this file:

```env
SERPAPI_KEY=your_serpapi_key_here
GROQ_API_KEY=your_groq_api_key_here
```
- Replace `your_serpapi_key_here` with your actual SerpAPI key (from [serpapi.com](https://serpapi.com)).
- Replace `your_groq_api_key_here` with your actual Groq API key (from [groq.com](https://groq.com)).

**Note on Demo User:** The backend is configured to automatically create a demo user (`username: demouser`, `password: password`) when it first starts up. This user can be used for testing login functionality.

## 4. Frontend Setup

The frontend is a React application built with Vite.

### 4.1. Navigate to Frontend Directory
```bash
cd frontend
```

### 4.2. Install Node.js Dependencies
```bash
npm install
```

### 4.3. Configure Frontend Environment Variables (Optional)
The frontend is configured to connect to the backend API at `http://localhost:5000/api` by default. If your backend runs on a different URL, you can override this.

Create a file named `.env` in the **`frontend` directory** (i.e., `frontend/.env`) and add:
```env
VITE_API_URL=http://your_backend_api_url/api 
# Example: VITE_API_URL=http://localhost:5000/api (this is the default)
VITE_APP_TITLE=LuxeStay Hotel Booking # Or your preferred application title
```
If you are running the backend locally on port 5000, setting `VITE_API_URL` is optional as the default will work.

### 4.4. Return to Project Root
```bash
cd .. 
```

## 5. Running the Application

### 5.1. Using the `run.bat` script (Windows)
If you are on Windows, the easiest way to start both backend and frontend is using the provided batch script. From the **project root directory**:
```bash
.\run.bat
```
This script will:
- Start the Flask backend server (typically on `http://localhost:5000`).
- Start the Vite frontend development server (typically on `http://localhost:8080`).

### 5.2. Running Backend and Frontend Separately (All Platforms)

**Start the Backend:**
1.  Ensure your Python virtual environment is activated.
2.  From the **project root directory**, run:
    ```bash
    python api.py
    ```
    The backend API should start, usually on `http://localhost:5000`.

**Start the Frontend:**
1.  Open a **new terminal window or tab**.
2.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
3.  Run the Vite development server:
    ```bash
    npm run dev
    ```
    The frontend application should start, typically on `http://localhost:3000` (Vite's default) or `http://localhost:8080` (if configured by `run_frontend.bat` or `vite.config.ts`). Check the terminal output for the exact URL.

## 6. Accessing the Application

Once both backend and frontend are running, open your web browser and navigate to the frontend URL (e.g., `http://localhost:8080` if using `run.bat`, or the URL shown by `npm run dev`, typically `http://localhost:3000`).

## 7. Stopping the Application

- If you used `.\run.bat`, it opens two new terminal windows for the backend and frontend. Close these windows to stop the application.
- If you started them separately, press `Ctrl+C` in each terminal window where the backend and frontend servers are running.

## 8. Important Notes & Potential Issues

- **Port Conflicts:** Ensure that ports 5000, 8080 (or 3000 for frontend if run manually) are not already in use by other applications.
- **Demo User:** A 'demouser' with password 'password' should be available for login if the backend started correctly after setup.
- **Hotel Detail Page:** During testing, issues were observed where hotel details could not be fetched (resulting in a "Hotel Not Found" page). This might be related to the validity or usage of `property_token`s from the external SerpApi.
- **UI Interactions:** Some UI elements (like search forms and registration inputs) exhibited unexpected scrolling or focus behavior during automated testing. Manual testing may be required to fully assess these.
- **Protected Routes:** Most pages now require login. If you access them directly, you should be redirected to the login page.

This guide should help you get the Hotel Booking Application up and running.
