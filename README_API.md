# Hotel Booking API

This API provides backend services for a hotel booking application. It replaces the previous Streamlit app with RESTful endpoints that can be consumed by any frontend application.

## Setup

1. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Set up environment variables:
   Create a `.env` file with the following variables:
   ```
   SERPAPI_KEY=your_serpapi_key
   GROQ_API_KEY=your_groq_api_key
   ```

3. Run the API:
   ```
   python api.py
   ```

## API Endpoints

### Authentication

#### Register a new user
- **URL**: `/api/register`
- **Method**: POST
- **Body**:
  ```json
  {
    "username": "example_user",
    "password": "Password123",
    "email": "user@example.com",
    "full_name": "Example User"
  }
  ```
- **Success Response**: 201 Created
  ```json
  {
    "message": "Registration successful"
  }
  ```
- **Error Response**: 
  - 400 Bad Request (Invalid input)
  - 409 Conflict (Username or email already exists)

#### Login
- **URL**: `/api/login`
- **Method**: POST
- **Body**:
  ```json
  {
    "username": "example_user",
    "password": "Password123"
  }
  ```
- **Success Response**: 200 OK
  ```json
  {
    "message": "Login successful",
    "user": {
      "id": 1,
      "username": "example_user",
      "email": "user@example.com",
      "full_name": "Example User"
    }
  }
  ```
- **Error Response**: 
  - 400 Bad Request (Missing credentials)
  - 401 Unauthorized (Invalid credentials)

### Hotel Search

#### Search for Hotels
- **URL**: `/api/hotels/search`
- **Method**: GET
- **Required Parameters**:
  - `destination`: City or location name (used as the `q` parameter in the API)
  - `check_in_date`: Check-in date in YYYY-MM-DD format
  - `check_out_date`: Check-out date in YYYY-MM-DD format
- **Optional Parameters**:
  - `adults`: Number of adults (default: 2)
  - `sort_by`: Sort results (3 for lowest price, 8 for highest rating, 13 for most reviewed)
  - `min_price`: Minimum price (numeric)
  - `max_price`: Maximum price (numeric)
  - `property_types`: Comma-separated list of property types (17 for Hotel, 12 for Vacation Rental, 18 for Apartment)
  - `amenities`: Comma-separated list of amenities (35 for Free Wi-Fi, 9 for Pool, 19 for Free Breakfast)
  - `rating`: Minimum rating (7 for 3.5+, 8 for 4.0+, 9 for 4.5+)
  - `brands`: Comma-separated list of hotel brands
  - `hotel_class`: Comma-separated list of hotel classes (2 for 2-star, 3 for 3-star, etc.)
  - `eco_certified`: Set to "true" for eco-certified properties
  - `vacation_rentals`: Set to "true" to include vacation rentals
  - `bedrooms`: Minimum number of bedrooms for vacation rentals (numeric)
  - `bathrooms`: Minimum number of bathrooms for vacation rentals (numeric)
  - `free_cancellation`: Set to "true" for free cancellation
  - `special_offers`: Set to "true" for special offers
  - `next_page_token`: Token for pagination
- **Success Response**: 200 OK 
  - Returns the complete SerpAPI response with hotel properties
- **Error Response**: 
  - 400 Bad Request (Missing required parameters)
  - 500 Internal Server Error (API failure)

### Bookings

#### Create a Booking
- **URL**: `/api/bookings`
- **Method**: POST
- **Body**:
  ```json
  {
    "user_id": 1,
    "hotel_name": "Example Hotel",
    "hotel_id": "property_token_123",
    "city": "New York",
    "check_in": "2023-12-15",
    "check_out": "2023-12-20",
    "room_type": "Standard Room",
    "total_price": 1500.50,
    "payment": {
      "card_number": "1234567890123456",
      "expiry": "12/25",
      "cvv": "123",
      "cardholder": "Example User"
    }
  }
  ```
- **Success Response**: 201 Created
  ```json
  {
    "message": "Booking successful",
    "booking_id": 1,
    "transaction_id": 123456
  }
  ```
- **Error Response**: 
  - 400 Bad Request (Missing fields or invalid payment details)
  - 500 Internal Server Error (Database error)

#### Get User Bookings
- **URL**: `/api/bookings/:user_id`
- **Method**: GET
- **URL Parameters**: `user_id` - User ID (integer)
- **Success Response**: 200 OK
  ```json
  [
    {
      "id": 1,
      "user_id": 1,
      "hotel_name": "Example Hotel",
      "city": "New York",
      "check_in": "2023-12-15",
      "check_out": "2023-12-20",
      "room_type": "Standard Room",
      "total_price": 1500.50,
      "booking_date": "2023-12-01 14:30:25",
      "hotel_id": "property_token_123"
    }
  ]
  ```
- **Success Response (No bookings)**: 200 OK with empty array
  ```json
  []
  ```

### Chat

#### Chat with Travel Bot
- **URL**: `/api/chat`
- **Method**: POST
- **Body**:
  ```json
  {
    "message": "Tell me about hotels in Paris",
    "conversation_history": [
      {"role": "user", "content": "I want to book a hotel"},
      {"role": "assistant", "content": "I can help you with that."}
    ]
  }
  ```
- **Success Response**: 200 OK
  ```json
  {
    "response": "Paris has numerous hotels ranging from budget to luxury..."
  }
  ```
- **Error Response**: 
  - 400 Bad Request (Missing message)
  - 500 Internal Server Error (LLM processing error)
  - 503 Service Unavailable (Chat service unavailable)

## Cross-Origin Resource Sharing (CORS)

This API supports Cross-Origin Resource Sharing (CORS) for browser-based applications. All routes support CORS, allowing them to be called from any origin.

## Example Usage

### Search for Hotels
```javascript
// JavaScript fetch example
fetch('http://localhost:5000/api/hotels/search?destination=Paris&check_in_date=2023-12-15&check_out_date=2023-12-20&adults=2')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

### Create a Booking
```javascript
// JavaScript fetch example
fetch('http://localhost:5000/api/bookings', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    "user_id": 1,
    "hotel_name": "Example Hotel",
    "hotel_id": "property_token_123",
    "city": "Paris",
    "check_in": "2023-12-15",
    "check_out": "2023-12-20",
    "room_type": "Standard Room",
    "total_price": 1500.50,
    "payment": {
      "card_number": "1234567890123456",
      "expiry": "12/25",
      "cvv": "123",
      "cardholder": "Example User"
    }
  }),
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

### Testing the API

You can test all API endpoints using the included test script:

```bash
python test_api.py
```

The script performs comprehensive testing of all endpoints and provides a summary of test results. 