# Hotel Booking Application

A modern full-stack hotel booking platform built with React/TypeScript and Flask, featuring real-time hotel search, secure booking management, and an AI-powered chat assistant.

## Tech Stack

### Frontend
- React with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Shadcn UI components
- React Router for navigation

### Backend
- Flask (Python)
- SQLite for database
- SerpAPI for hotel data
- Groq API for chat functionality

## Features

- **Real-time Hotel Search**: Integration with Google Hotels API via SerpAPI
- **User Authentication**: Secure login and registration system
- **Booking Management**: Create and track hotel bookings
- **Modern UI Components**: Built with Shadcn UI and Tailwind CSS
- **AI Chat Assistant**: Integrated with Groq API for travel assistance
- **Responsive Design**: Full mobile responsiveness

## Project Structure

```
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   │   ├── auth/      # Authentication components
│   │   │   ├── home/      # Home page components
│   │   │   ├── hotels/    # Hotel-related components
│   │   │   ├── layout/    # Layout components
│   │   │   └── ui/        # Shadcn UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions
│   │   └── pages/         # Application pages
│   └── public/            # Static assets
├── api.py                  # Flask backend server
├── requirements.txt        # Python dependencies
└── *.bat                  # Utility scripts
```

## Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- SerpAPI key
- Groq API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/safdarjung/hotel_booking_imp_UI.git
cd hotel_booking_imp_UI
```

2. **Set up the backend**
   - Create a `.env` file in the root directory:
   ```
   SERPAPI_KEY=your_serpapi_key
   GROQ_API_KEY=your_groq_api_key
   ```
   - Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up the frontend**
   - Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
   - Install dependencies:
   ```bash
   npm install
   ```
   - Create a `.env` file in the frontend directory:
   ```
   VITE_API_URL=http://localhost:5000
   ```

### Running the Application

1. **Start the backend server**
```bash
.\run_backend.bat
```
The API will be available at `http://localhost:5000`

2. **Start the frontend development server**
```bash
.\run_frontend.bat
```
The application will be available at `http://localhost:5173`

Alternatively, you can use `run.bat` to start both servers simultaneously.

## API Documentation

For detailed information about the REST API endpoints and integration guide, please refer to:
- [API Documentation](README_API.md)
- [Integration Guide](INTEGRATION.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)

## Available Scripts

- `run_backend.bat`: Starts the Flask backend server
- `run_frontend.bat`: Starts the Vite development server
- `run.bat`: Starts both backend and frontend
- `setup.bat`: Sets up the development environment

## API Documentation

For detailed information about the API endpoints and integration details, refer to:
- [API Documentation](README_API.md)
- [Integration Guide](INTEGRATION.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
