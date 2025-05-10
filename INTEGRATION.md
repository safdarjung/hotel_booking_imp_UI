# Hotel Booking Application - Frontend-Backend Integration Guide

This guide explains how to integrate the React frontend application with the Flask backend API.

## Project Structure

The project is organized with two main components:

- **Backend** - A Flask API that provides endpoints for hotel search, booking, user management, and chat
- **Frontend** - A React application built with Vite, React Router, React Query, and Tailwind CSS

## Setup Steps

### 1. Install Backend Dependencies

```bash
# From the root directory
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory with the following variables:

```
SERPAPI_KEY=your_serpapi_key
GROQ_API_KEY=your_groq_api_key
```

### 3. Install Frontend Dependencies

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install
```

### 4. Configure Frontend Environment

Create a `.env` file in the frontend directory:

```
VITE_API_URL=http://localhost:5000/api
VITE_APP_TITLE=Hotel Booking App
```

## Running the Application

### Start the Backend

From the root directory:

```bash
# Start the Flask API
python api.py
```

The API will be available at http://localhost:5000.

### Start the Frontend

In a separate terminal, from the frontend directory:

```bash
# Start the development server
npm run dev
```

The frontend will be available at http://localhost:3000.

## API Integration

The frontend connects to the backend API using the real API implementation in `src/lib/realApi.ts`. This file contains all the necessary functions to interact with the backend endpoints.

### Available API Functions

- **Authentication**
  - `loginUser(username, password)` - Log in a user
  - `registerUser(username, password, email, full_name)` - Register a new user

- **Hotel Search and Booking**
  - `searchHotels(params)` - Search for hotels with various filters
  - `getHotelById(id)` - Get details for a specific hotel
  - `createBooking(...)` - Create a new booking
  - `getUserBookings(userId)` - Get a user's bookings

- **Chat**
  - `sendChatMessage(message, conversation_history)` - Send a message to the chat assistant

### Using the API in Components

Here's an example of how to use the API in a React component with React Query:

```tsx
import { useQuery } from '@tanstack/react-query';
import { searchHotels } from '@/lib/realApi';

function HotelSearch() {
  const { data: hotels, isLoading, error } = useQuery({
    queryKey: ['hotels', searchParams],
    queryFn: () => searchHotels(searchParams)
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {hotels.map(hotel => (
        <div key={hotel.id}>
          <h2>{hotel.name}</h2>
          <p>{hotel.description}</p>
          {/* ... */}
        </div>
      ))}
    </div>
  );
}
```

## Development Proxy Configuration

During development, API requests are proxied through the Vite development server to avoid CORS issues. This configuration is in `vite.config.ts`:

```ts
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
      secure: false,
    }
  }
}
```

This means that when the frontend makes a request to `/api/*`, it will be forwarded to `http://localhost:5000/api/*`.

## Switching Between Mock and Real API

The frontend includes both mock (`src/lib/api.ts`) and real (`src/lib/realApi.ts`) API implementations. To switch between them:

1. In files where you import the API, change the import path:

   ```tsx
   // Mock API
   import { searchHotels } from '@/lib/api';
   
   // Real API
   import { searchHotels } from '@/lib/realApi';
   ```

2. You can also create a context to provide the API implementation throughout the application.

## Production Deployment

For production deployment:

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. The build output will be in the `frontend/dist` directory.

3. Configure your web server to serve the backend API and the static frontend files.

4. For separate hosting:
   - Deploy the API on a server and note its URL
   - Set `VITE_API_URL` to the production API URL when building the frontend
   - Deploy the frontend static files to a CDN or web hosting service

## Common Integration Issues and Solutions

### CORS Errors

If you encounter CORS errors:

1. Ensure the backend has CORS headers properly configured
2. Verify the proxy settings in `vite.config.ts`
3. Check that the API URL in `.env` is correct

### API Response Format Mismatches

If the frontend is not handling API responses correctly:

1. Check the response transformation in `realApi.ts`
2. Use browser developer tools to compare expected vs. actual API responses
3. Update the interface definitions in `realApi.ts` to match the API

### Authentication Issues

If users are not being authenticated properly:

1. Verify the login/register API calls are sending the correct data format
2. Check that the frontend is storing and sending authentication tokens correctly
3. Test the API endpoints directly using tools like Postman or curl

## Extending the Application

### Adding New API Endpoints

1. Add the endpoint to the Flask backend in `api.py`
2. Create corresponding functions in `realApi.ts`
3. Use the new functions in your React components

### Adding New Pages

1. Create a new page component in `src/pages/`
2. Add the route to `App.tsx`
3. Implement the required API calls using the functions from `realApi.ts`

## Testing the Integration

To verify that the frontend and backend are properly integrated:

1. Run the test script to ensure all API endpoints are working:
   ```bash
   python test_api.py
   ```

2. Test the frontend integration by registering a user, logging in, searching for hotels, and creating a booking.

## Troubleshooting

- **Backend API not responding**: Ensure the Flask server is running and check the console for errors
- **Frontend can't connect to API**: Verify the API URL and proxy configuration
- **Authentication failing**: Check the request and response format in the network tab of browser dev tools
- **Data not displaying correctly**: Compare API response with frontend data models 