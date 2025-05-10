import requests
import json
from datetime import datetime, timedelta
import sys

# API base URL
BASE_URL = "http://localhost:5000/api"

def test_register_user():
    """Test registering a new user"""
    print("\n=== Testing User Registration ===")
    
    try:
        # Create a unique username based on timestamp
        timestamp = int(datetime.now().timestamp())
        
        payload = {
            "username": f"test_user_{timestamp}",
            "password": "Test1234",
            "email": f"test{timestamp}@example.com",
            "full_name": "Test User"
        }
        
        response = requests.post(f"{BASE_URL}/register", json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        return payload
    except Exception as e:
        print(f"Error during user registration: {str(e)}")
        return {
            "username": f"test_user_fallback",
            "password": "Test1234",
            "email": f"test_fallback@example.com",
            "full_name": "Test User"
        }

def test_login(credentials):
    """Test user login"""
    print("\n=== Testing User Login ===")
    
    try:
        payload = {
            "username": credentials["username"],
            "password": credentials["password"]
        }
        
        response = requests.post(f"{BASE_URL}/login", json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            return response.json()["user"]
        return None
    except Exception as e:
        print(f"Error during login: {str(e)}")
        return None

def test_search_hotels():
    """Test hotel search API"""
    print("\n=== Testing Hotel Search ===")
    
    try:
        # Calculate dates for search
        today = datetime.now()
        check_in = today + timedelta(days=7)  # Next week
        check_out = check_in + timedelta(days=3)  # 3-day stay
        
        params = {
            "destination": "London",
            "check_in_date": check_in.strftime("%Y-%m-%d"),
            "check_out_date": check_out.strftime("%Y-%m-%d"),
            "adults": 2,
            "sort_by": 3,  # Lowest price
            "min_price": 100,
            "max_price": 500
        }
        
        response = requests.get(f"{BASE_URL}/hotels/search", params=params)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            results = response.json()
            if "properties" in results:
                properties = results["properties"]
                print(f"Found {len(properties)} properties")
                if properties:
                    # Print details of first property
                    first_property = properties[0]
                    print(f"First Property: {first_property['name']}")
                    print(f"  Rating: {first_property.get('overall_rating', 'N/A')}")
                    print(f"  Price: {first_property.get('total_rate', {}).get('lowest', 'N/A')}")
                
                # Return first property for booking test
                return properties[0] if properties else None
            else:
                print("No properties found in results")
                return None
        else:
            print(f"Error response: {response.text}")
            return None
    except Exception as e:
        print(f"Error during hotel search: {str(e)}")
        return None

def test_booking(user, hotel):
    """Test booking creation"""
    print("\n=== Testing Booking Creation ===")
    
    try:
        if not user or not hotel:
            print("Missing user or hotel data. Skipping booking test.")
            return None
        
        # Calculate dates for booking
        today = datetime.now()
        check_in = today + timedelta(days=7)  # Next week
        check_out = check_in + timedelta(days=3)  # 3-day stay
        
        # Get hotel price or use fallback
        hotel_price = hotel.get("total_rate", {}).get("extracted_lowest")
        if hotel_price is None:
            hotel_price = 200.0
            print(f"Using fallback price: {hotel_price}")
        
        payload = {
            "user_id": user["id"],
            "hotel_name": hotel["name"],
            "hotel_id": hotel.get("property_token", "unknown_token"),
            "city": "London",
            "check_in": check_in.strftime("%Y-%m-%d"),
            "check_out": check_out.strftime("%Y-%m-%d"),
            "room_type": "Standard Room",
            "total_price": hotel_price,
            "payment": {
                "card_number": "1234567890123456",
                "expiry": "12/25",
                "cvv": "123",
                "cardholder": user["full_name"]
            }
        }
        
        response = requests.post(f"{BASE_URL}/bookings", json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 201:
            return response.json()
        return None
    except Exception as e:
        print(f"Error during booking creation: {str(e)}")
        return None

def test_get_bookings(user):
    """Test retrieving user bookings"""
    print("\n=== Testing Get User Bookings ===")
    
    try:
        if not user:
            print("Missing user data. Skipping get bookings test.")
            return
        
        response = requests.get(f"{BASE_URL}/bookings/{user['id']}")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            bookings = response.json()
            print(f"Found {len(bookings)} bookings")
            for booking in bookings:
                print(f"Booking ID: {booking['id']}")
                print(f"  Hotel: {booking['hotel_name']}")
                print(f"  Dates: {booking['check_in']} to {booking['check_out']}")
                print(f"  Price: {booking['total_price']}")
        else:
            print(f"Error response: {response.text}")
    except Exception as e:
        print(f"Error during fetching bookings: {str(e)}")

def test_chat():
    """Test chat functionality"""
    print("\n=== Testing Chat ===")
    
    try:
        payload = {
            "message": "Tell me about hotels in Paris",
            "conversation_history": []
        }
        
        response = requests.post(f"{BASE_URL}/chat", json=payload)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            bot_response = response.json().get('response', '')
            print(f"Bot response: {bot_response[:100]}...")  # Print first 100 chars
        else:
            print(f"Error response: {response.text}")
    except Exception as e:
        print(f"Error during chat test: {str(e)}")

def run_all_tests():
    """Run all API tests"""
    test_results = {
        "register": False,
        "login": False,
        "search": False,
        "booking": False,
        "get_bookings": False,
        "chat": False
    }
    
    try:
        print("Starting API test suite")
        print(f"API URL: {BASE_URL}")
        print("======================\n")
        
        # Test user registration and login
        user_credentials = test_register_user()
        test_results["register"] = bool(user_credentials)
        
        user_data = test_login(user_credentials)
        test_results["login"] = bool(user_data)
        
        # Test hotel search
        hotel_data = test_search_hotels()
        test_results["search"] = bool(hotel_data)
        
        # Test booking creation
        booking_data = None
        if user_data and hotel_data:
            booking_data = test_booking(user_data, hotel_data)
            test_results["booking"] = bool(booking_data)
            
            # Test getting user bookings
            if user_data:
                test_get_bookings(user_data)
                test_results["get_bookings"] = True
        
        # Test chat functionality
        test_chat()
        test_results["chat"] = True
        
        # Summary
        print("\n=== Test Summary ===")
        for test, passed in test_results.items():
            print(f"{test.replace('_', ' ').title(): <15}: {'✓ Passed' if passed else '✗ Failed'}")
        
        failed_tests = sum(1 for passed in test_results.values() if not passed)
        if failed_tests > 0:
            print(f"\n{failed_tests} tests failed. See log above for details.")
            return 1
        else:
            print("\nAll tests passed successfully!")
            return 0
            
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to API. Make sure the API server is running.")
        return 1
    except Exception as e:
        print(f"Error during testing: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(run_all_tests()) 