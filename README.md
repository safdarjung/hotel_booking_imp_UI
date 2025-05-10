# Hotel Booking Application

Welcome to the Hotel Booking Application! This project provides both a Streamlit web application and a REST API version that allows you to search for hotels, book them, and simulate a payment process—all without any real transactions.

## Project Versions

This repository contains two versions of the hotel booking application:

1. **Streamlit Web App** (`app.py`): A user-friendly web application built with Python and Streamlit.
2. **REST API** (`api.py`): A Flask-based REST API that can be used with any frontend.

## What This Application Does

- **Search Hotels**: Look for hotels in any city using real data from the SerpAPI Google Hotels API.
- **Book a Hotel**: Select a hotel, specify the number of people and rooms, and proceed to a booking summary.
- **Simulate Payment**: Enter fake payment details to mimic a real payment process (nothing is actually charged).
- **Chat with a Bot**: Use a chatbot to help with booking or answer travel-related questions.
- **View Bookings**: See a list of your past bookings.

## Prerequisites

Before you start, make sure you have the following:

- Python 3.7 or higher
- Internet Connection
- API Keys:
  - A SerpAPI Key for hotel search data (from [serpapi.com](https://serpapi.com))
  - A Groq API Key for the chatbot feature (from [groq.com](https://groq.com))

## Setup Guide

### Step 1: Clone or Download the Repository

```bash
git clone <repository-url>
cd hotel-booking-application
```

### Step 2: Set Up API Keys

Create a `.env` file in the project root and add your API keys:

```
SERPAPI_KEY=your_serpapi_key
GROQ_API_KEY=your_groq_api_key
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

## Running the Applications

### Option 1: Run the Streamlit Web App

```bash
streamlit run app.py
```

Your default web browser should automatically open to http://localhost:8501.

### Option 2: Run the REST API

```bash
python api.py
```

The API will be accessible at http://localhost:5000.

## API Documentation

For detailed information about the REST API endpoints, please refer to the [API Documentation](README_API.md).

## Testing the API

We've included a comprehensive test script to demonstrate how to use the API:

```bash
python test_api.py
```

This script will:
1. Register a test user
2. Log in with the test user
3. Search for hotels
4. Create a test booking
5. Retrieve the user's bookings
6. Test the chat feature

The test script includes improved error handling to ensure tests can continue even if some tests fail, and provides a summary of test results at the end.

## Streamlit App Features

- **User Authentication**: Register and log in to access the app.
- **Hotel Search**: Search for hotels with various filters.
- **Booking Management**: View and manage your bookings.
- **Interactive Chat**: Get help from a travel assistant bot.

## API Features

- **RESTful Endpoints**: Standard HTTP methods for all operations.
- **User Authentication**: Register and authenticate users.
- **Hotel Search**: Comprehensive search with multiple parameters.
- **Booking Management**: Create and retrieve bookings.
- **Chat Functionality**: Interact with a travel assistant bot via API calls.
- **CORS Support**: Cross-Origin Resource Sharing enabled for integration with any web frontend.

## Technologies Used

- **Frontend** (Streamlit App): Streamlit, Python
- **Backend** (API): Flask, Flask-CORS, SQLite
- **External Services**: SerpAPI (for hotel data), Groq (for chatbot functionality)

## Development and Production

### Development Mode
The API runs in development mode by default, with debugging enabled.

### Production Deployment
For production deployment, consider:
- Using a production WSGI server like Gunicorn or uWSGI
- Setting up proper authentication mechanisms (JWT, OAuth)
- Implementing rate limiting
- Securing sensitive environment variables

## Note

This is a demonstration application. No real payments are processed, and all hotel data comes from the SerpAPI service.

## Integration with Frontend

This project now includes integration with a modern React frontend. The integration allows you to use all the API features through a beautiful, animated user interface.

### Integration Features

- **Full API Integration**: All API endpoints are accessible through the frontend
- **Development Proxy**: Vite development server proxies API requests to avoid CORS issues
- **Real-time API Connection**: React Query for efficient data fetching and caching
- **Development Script**: Run both frontend and backend with a single command

### Running the Integrated Application

You can run both the frontend and backend together using the development script:

```bash
# Install Node.js dependencies first
cd frontend
npm install
cd ..

# Run the development script
node dev.js
```

This will start both the Flask backend API and the React frontend development server.

### Integration Documentation

For detailed instructions on the frontend-backend integration, see [INTEGRATION.md](INTEGRATION.md).
