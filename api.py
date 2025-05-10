from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os
from dotenv import load_dotenv
import requests
from datetime import date, datetime, timedelta
import hashlib
import logging
import time
import random
import re
from groq import Groq
import httpx # Added import
from urllib.parse import urlparse, urlunparse, parse_qs, urlencode # Added for URL manipulation

# Load environment variables
load_dotenv(override=True)

# Set up logging
logging.basicConfig(level=logging.DEBUG, 
                    format='%(asctime)s - %(levelname)s - %(message)s',
                    filename='hotel_booking_debug.log',
                    filemode='w') # Use 'w' to overwrite log on each start, making it easier to find latest run

logging.critical("--- API SCRIPT STARTED - VERSION 10:35PM ---") # Unique startup message

app = Flask(__name__)
# Enable CORS for all routes
CORS(app)

# Password hashing function
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# Helper to safely access nested keys
def get_nested(data, keys, default=None):
    for key in keys:
        if isinstance(data, dict) and key in data:
            data = data[key]
        else:
            return default
    return data

# Database Manager Class
class DatabaseManager:
    def __init__(self):
        self.create_tables()

    def create_tables(self):
        conn = sqlite3.connect('hotel_booking.db')
        try:
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    full_name TEXT
                )
            ''')
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS bookings (
                    id INTEGER PRIMARY KEY,
                    user_id INTEGER,
                    hotel_name TEXT,
                    city TEXT,
                    check_in DATE,
                    check_out DATE,
                    room_type TEXT,
                    total_price REAL,
                    booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    hotel_id TEXT,
                    FOREIGN KEY(user_id) REFERENCES users(id)
                )
            ''')
            conn.commit()
        except sqlite3.Error as e:
            logging.error(f"Database error during table creation: {e}")
        finally:
            conn.close()

    def user_exists(self, username):
        conn = sqlite3.connect('hotel_booking.db')
        try:
            cursor = conn.cursor()
            cursor.execute('SELECT id FROM users WHERE username = ?', (username,))
            return cursor.fetchone() is not None
        except sqlite3.Error as e:
            logging.error(f"Database error during user_exists check: {e}")
            return False # Assume not exists on error to be safe for creation logic
        finally:
            conn.close()

    def register_user(self, username, password, email, full_name):
        conn = sqlite3.connect('hotel_booking.db')
        try:
            cursor = conn.cursor()
            hashed_password = hash_password(password)
            cursor.execute('INSERT INTO users (username, password, email, full_name) VALUES (?, ?, ?, ?)',
                           (username, hashed_password, email, full_name))
            conn.commit()
            return True
        except sqlite3.IntegrityError as e:
            logging.error(f"Registration failed: {e}")
            return False
        except sqlite3.Error as e:
            logging.error(f"Database error during registration: {e}")
            return False
        finally:
            conn.close()

    def authenticate_user(self, username, password):
        conn = sqlite3.connect('hotel_booking.db')
        try:
            cursor = conn.cursor()
            hashed_password = hash_password(password)
            cursor.execute('SELECT id, username, email, full_name FROM users WHERE username = ? AND password = ?', (username, hashed_password))
            user = cursor.fetchone()
            if user:
                return {
                    "id": user[0],
                    "username": user[1],
                    "email": user[2],
                    "full_name": user[3]
                }
            return None
        except sqlite3.Error as e:
            logging.error(f"Database error during authentication: {e}")
            return None
        finally:
            conn.close()

    def save_booking(self, user_id, hotel_name, hotel_id, city, check_in, check_out, room_type, total_price):
        conn = sqlite3.connect('hotel_booking.db')
        try:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO bookings (user_id, hotel_name, hotel_id, city, check_in, check_out, room_type, total_price)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (user_id, hotel_name, hotel_id, city, check_in, check_out, room_type, total_price))
            conn.commit()
            return cursor.lastrowid
        except sqlite3.Error as e:
            logging.error(f"Database error during booking save: {e}")
            return None
        finally:
            conn.close()

    def get_user_bookings(self, user_id):
        conn = sqlite3.connect('hotel_booking.db')
        try:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT id, user_id, hotel_name, city, check_in, check_out, room_type, total_price, booking_date, hotel_id
                FROM bookings
                WHERE user_id = ? ORDER BY booking_date DESC
            ''', (user_id,))
            bookings = cursor.fetchall()
            result = []
            for booking in bookings:
                result.append({
                    "id": booking[0],
                    "user_id": booking[1],
                    "hotel_name": booking[2],
                    "city": booking[3],
                    "check_in": booking[4],
                    "check_out": booking[5],
                    "room_type": booking[6],
                    "total_price": booking[7],
                    "booking_date": booking[8],
                    "hotel_id": booking[9]
                })
            return result
        except sqlite3.Error as e:
            logging.error(f"Database error during fetching bookings: {e}")
            return []
        finally:
            conn.close()

    def get_user_id(self, username):
        conn = sqlite3.connect('hotel_booking.db')
        try:
            cursor = conn.cursor()
            cursor.execute('SELECT id FROM users WHERE username = ?', (username,))
            result = cursor.fetchone()
            return result[0] if result else None
        except sqlite3.Error as e:
            logging.error(f"Database error during fetching user ID: {e}")
            return None
        finally:
            conn.close()

    def ensure_demo_user_exists(self):
        demo_username = "demouser"
        demo_password = "password" # Plain text, will be hashed by register_user
        demo_email = "demo@example.com"
        demo_full_name = "Demo User"

        if not self.user_exists(demo_username):
            logging.info(f"Attempting to create demo user: {demo_username}")
            if self.register_user(demo_username, demo_password, demo_email, demo_full_name):
                logging.info(f"Demo user '{demo_username}' created successfully.")
            else:
                # This might happen if email is taken but username wasn't, or other db error
                logging.error(f"Failed to create demo user '{demo_username}' during ensure_demo_user_exists.")
        else:
            logging.info(f"Demo user '{demo_username}' already exists.")

# Google Hotels API Client Class
class GoogleHotelsAPIClient:
    BASE_URL = "https://serpapi.com/search.json"

    def __init__(self):
        self.api_key = os.environ.get("SERPAPI_KEY")
        if not self.api_key:
            logging.error("SERPAPI_KEY environment variable is not set")
            raise ValueError("API Key Missing")

    def search_hotels(self, **params):
        default_params = {
            "engine": "google_hotels",
            "api_key": self.api_key,
            "currency": "INR",
            "gl": "in",  # Localize to India
            "hl": "en"   # Use English
        }
        search_params = {k: v for k, v in params.items() if v is not None}
        default_params.update(search_params)
        
        try:
            logging.debug(f"Sending hotel search request with params: {default_params}")
            response = requests.get(self.BASE_URL, params=default_params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if 'error' in data:
                error_message = data['error']
                logging.error(f"API returned error: {error_message}")
                return None
                
            logging.info(f"Hotel search successful for '{params.get('q')}'")
            logging.debug(f"API response: {data}")
            return data
        except requests.exceptions.HTTPError as e:
            error_message = f"HTTP Error: {str(e)}"
            if e.response.status_code == 400:
                try:
                    error_details = e.response.json().get('error', 'No additional error details provided')
                    error_message += f" - Details: {error_details}"
                except ValueError:
                    error_message += " - Could not parse error details from response"
            logging.error(error_message)
            return None
        except Exception as e:
            error_message = f"Error: {str(e)}"
            logging.error(error_message)
            return None

    def get_hotel_details(self, property_token: str, check_in_date: str = None, check_out_date: str = None):
        # Use the property_token as the 'q' (query) parameter for SerpApi
        # Also include default check_in/check_out dates as they might be required by SerpApi
        # or by Google Hotels backend even for specific property lookups.
        # Try using property_token as a direct parameter as per SerpApi "Property Details" section
        detail_params = {
            "engine": "google_hotels",
            "api_key": self.api_key,
            "property_token": property_token,
            # Optional: currency, gl, hl might still be useful or required by SerpApi
            "currency": "INR",
            "gl": "in",
            "hl": "en"
        }
        if check_in_date:
            detail_params["check_in_date"] = check_in_date
        if check_out_date:
            detail_params["check_out_date"] = check_out_date
            
        try:
            logging.debug(f"Sending hotel detail request (using property_token param) with params: {detail_params}")
            response = requests.get(self.BASE_URL, params=detail_params, timeout=10)
            response.raise_for_status() # Will raise for 4xx/5xx errors
            data = response.json()

            if 'error' in data: # Check for error messages within a successful (e.g. 200 OK) JSON response
                error_message = data.get('error', 'Unknown API error from SerpApi')
                logging.error(f"SerpApi returned an error for property_token {property_token}: {error_message}")
                return None
            
            # Assuming the response for a property_token lookup is the hotel object itself,
            # possibly nested under a standard key like 'property_results' or 'place_results', or at the root.
            # The SerpApi documentation example for a query that resolves to a single property (q=H10 Port Vell)
            # shows the hotel data directly at the root of the response object.
            logging.info(f"Hotel detail lookup successful for property_token '{property_token}'")
            logging.debug(f"API detail response for property_token: {data}")
            return data # The route handler will perform the transformation
            
        except requests.exceptions.HTTPError as e:
            logging.error(f"HTTP Error during hotel detail lookup for property_token {property_token}: {str(e)}")
            return None
        except requests.exceptions.RequestException as e: # Broader network/request related errors
            logging.error(f"RequestException during hotel detail lookup for property_token {property_token}: {str(e)}")
            return None
        except ValueError as e: # JSON decoding error
            logging.error(f"JSON decoding error during hotel detail lookup for property_token {property_token}: {str(e)}")
            return None
        except Exception as e: # Catch-all for other unexpected errors
            logging.error(f"Unexpected error during hotel detail lookup for property_token {property_token}: {str(e)}")
            return None

def is_hotel_or_travel_related(message):
    keywords = [
        "hotel", "booking", "reservation", "travel", "flight", "destination",
        "check-in", "check-out", "rooms", "vacation", "trip", "tour", "itinerary",
        "payment", "city", "stay", "guest", "check availability", "room type",
        "price", "rate", "accommodation", "lodging", "suite", "apartment", "hostel",
        "check room", "book", "my bookings", "cancel booking", "refund", "hotel info",
        "location", "address", "check status", "confirmation", "check price"
    ]
    message = message.lower()
    return any(keyword in message for keyword in keywords)

# Helper function to check payment expiry validity
def is_expiry_valid(expiry):
    try:
        month, year = map(int, expiry.split('/'))
        current_year = date.today().year % 100
        current_month = date.today().month
        return 1 <= month <= 12 and (year > current_year or (year == current_year and month >= current_month))
    except:
        return False

# Initialize managers
db_manager = DatabaseManager()
db_manager.ensure_demo_user_exists() # Ensure demo user is created on startup

try:
    google_hotels_client = GoogleHotelsAPIClient()
except ValueError:
    logging.error("Failed to initialize Google Hotels API client")

# Initialize chat client
groq_client = None
try:
    # Explicitly create an httpx client that doesn't use environment proxies
    custom_http_client = httpx.Client(trust_env=False)
    groq_api_key = os.environ.get("GROQ_API_KEY")
    if not groq_api_key:
        logging.error("GROQ_API_KEY environment variable is not set")
    else:
        groq_client = Groq(api_key=groq_api_key, http_client=custom_http_client)
        # The Groq client might do its own check for api_key, so the following might be redundant
        # or could be an assertion if the constructor doesn't raise an error on empty key.
        # For safety, let's assume Groq() might not raise immediately on empty/None key.
        if not groq_client.api_key: # Check if the key was accepted by the client
             logging.warning("Groq client initialized but API key seems invalid or empty.")
             # Depending on Groq SDK behavior, might need to set groq_client to None here
             # if it doesn't function without a valid key.
except Exception as e:
    logging.error(f"Failed to initialize Groq client: {e}")
    # Ensure groq_client remains None if initialization fails

# Mock function to simulate room availability check
def check_room_availability(hotel):
    extracted_rate = hotel.get('total_rate', {}).get('extracted_lowest', None)
    return extracted_rate is not None

# API Routes
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['username', 'password', 'email', 'full_name']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    # Validate username
    if len(data['username']) < 4:
        return jsonify({"error": "Username must be at least 4 characters long"}), 400
    if not re.match(r'^[a-zA-Z0-9_]+$', data['username']):
        return jsonify({"error": "Username can only contain letters, numbers, and underscores"}), 400
    
    # Validate password
    if len(data['password']) < 8:
        return jsonify({"error": "Password must be at least 8 characters long"}), 400
    if not re.search(r'[A-Z]', data['password']) or not re.search(r'[a-z]', data['password']) or not re.search(r'[0-9]', data['password']):
        return jsonify({"error": "Password must contain at least one uppercase letter, one lowercase letter, and one number"}), 400
    
    # Validate email
    if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', data['email']):
        return jsonify({"error": "Invalid email format"}), 400
    
    # Register user
    if db_manager.register_user(data['username'], data['password'], data['email'], data['full_name']):
        return jsonify({"message": "Registration successful"}), 201
    else:
        return jsonify({"error": "Username or email already exists"}), 409

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    
    # Validate required fields
    if 'username' not in data or 'password' not in data:
        return jsonify({"error": "Username and password are required"}), 400
    
    # Authenticate user
    user = db_manager.authenticate_user(data['username'], data['password'])
    if user:
        return jsonify({"message": "Login successful", "user": user}), 200
    else:
        return jsonify({"error": "Invalid username or password"}), 401

@app.route('/api/hotels/search', methods=['GET'])
def search_hotels():
    # Extract query parameters
    params = {
        'q': request.args.get('destination'),
        'check_in_date': request.args.get('check_in_date'),
        'check_out_date': request.args.get('check_out_date'),
        'adults': request.args.get('adults'),
        'sort_by': request.args.get('sort_by'),
        'min_price': request.args.get('min_price'),
        'max_price': request.args.get('max_price'),
        'property_types': request.args.get('property_types'),
        'amenities': request.args.get('amenities'),
        'rating': request.args.get('rating'),
        'brands': request.args.get('brands'),
        'hotel_class': request.args.get('hotel_class'),
        'eco_certified': request.args.get('eco_certified'),
        'vacation_rentals': request.args.get('vacation_rentals'),
        'bedrooms': request.args.get('bedrooms'),
        'bathrooms': request.args.get('bathrooms'),
        'free_cancellation': request.args.get('free_cancellation'),
        'special_offers': request.args.get('special_offers'),
        'next_page_token': request.args.get('next_page_token')
    }
    
    # Validate required parameters
    if not params['q']:
        return jsonify({"error": "Destination is required"}), 400
    if not params['check_in_date']:
        return jsonify({"error": "Check-in date is required"}), 400
    if not params['check_out_date']:
        return jsonify({"error": "Check-out date is required"}), 400
    
    # Convert numeric parameters
    if params['adults']:
        params['adults'] = int(params['adults'])
    if params['min_price'] and params['min_price'] != '0':
        params['min_price'] = int(params['min_price'])
    else:
        params['min_price'] = None
    if params['max_price'] and params['max_price'] != '0':
        params['max_price'] = int(params['max_price'])
    else:
        params['max_price'] = None
    if params['bedrooms'] and params['bedrooms'] != '0':
        params['bedrooms'] = int(params['bedrooms'])
    else:
        params['bedrooms'] = None
    if params['bathrooms'] and params['bathrooms'] != '0':
        params['bathrooms'] = int(params['bathrooms'])
    else:
        params['bathrooms'] = None
    
    # Search hotels
    results = google_hotels_client.search_hotels(**params)
    if results:
        return jsonify(results), 200
    else:
        return jsonify({"error": "Failed to search hotels"}), 500

@app.route('/api/hotel_detail/<property_token>', methods=['GET'])
def get_hotel_detail_route(property_token):
    if not property_token:
        return jsonify({"error": "Property token is required"}), 400

    check_in_date = request.args.get('check_in_date')
    check_out_date = request.args.get('check_out_date')

    hotel_detail_data = google_hotels_client.get_hotel_details(property_token, check_in_date, check_out_date)

    if not hotel_detail_data:
        logging.warning(f"No hotel_detail_data received from google_hotels_client.get_hotel_details for token {property_token}")
        return jsonify({"error": "Failed to fetch hotel details or hotel not found"}), 404 # Or 500 if it's a server/API issue

    logging.debug(f"Raw hotel_detail_data for token {property_token} before transformation: {hotel_detail_data}")

    # Transform hotel_detail_data to the frontend's Hotel interface
    # This needs to map fields from SerpApi's single property detail response.
    # Assuming structure similar to 'properties' items but at root or under a specific key.
    # The SerpApi example for `q=H10 Port Vell` shows hotel data at root.
    # Let's assume hotel_detail_data is the root object containing hotel info.
    
    try:
        # Check if the main data is under a specific key like 'place_results' or 'property_data'
        # For now, assume it's at the root as per some SerpApi examples for direct lookups.
        prop = hotel_detail_data 
        if 'place_results' in hotel_detail_data: # Common for place details
             prop = hotel_detail_data['place_results']
        elif 'property_data' in hotel_detail_data: # Hypothetical key
             prop = hotel_detail_data['property_data']
        # Add more checks if SerpApi uses other keys for direct property_token lookup response

        transformed_hotel = {
            "id": prop.get("property_token") or property_token, # Use original token if not in response
            "name": prop.get("name") or prop.get("title") or "Unknown Hotel",
            "description": prop.get("description") or get_nested(prop, ['summary', 'text']) or "No description available.",
            "location": prop.get("address") or prop.get("localized_address") or "Unknown location",
            "price": get_nested(prop, ['rate_per_night', 'extracted_lowest']) or get_nested(prop, ['prices', 0, 'rate_per_night', 'extracted_lowest']) or 0,
            "rating": prop.get("overall_rating") or prop.get("rating") or 0,
            "images": [img.get("image") or img.get("thumbnail") or img.get("original_image") for img in prop.get("images", []) if img.get("image") or img.get("thumbnail") or img.get("original_image")] or \
                      ([prop.get("thumbnail")] if prop.get("thumbnail") else []), # Fallback for single thumbnail
            "amenities": prop.get("amenities") or []
        }
        # Ensure images has at least one placeholder if empty, to prevent frontend errors
        if not transformed_hotel["images"]:
            transformed_hotel["images"] = ["/placeholder.svg"] # Match frontend fallback

        logging.debug(f"Transformed hotel data for token {property_token} being sent to frontend: {transformed_hotel}")
        return jsonify(transformed_hotel), 200
    except Exception as e:
        logging.error(f"Error transforming hotel detail data for {property_token}: {e}. Raw data: {hotel_detail_data}")
        return jsonify({"error": "Error processing hotel data"}), 500

@app.route('/api/hotel_detail_from_link', methods=['GET'])
def get_hotel_detail_from_link_route():
    link_url = request.args.get('url')
    if not link_url:
        return jsonify({"error": "URL parameter is required"}), 400

    # Security: Ensure the URL is a SerpApi domain
    if not link_url.startswith("https://serpapi.com/"):
        return jsonify({"error": "Invalid URL domain"}), 400

    try:
        # Add api_key to the request to the SerpApi link
        # The link itself might have other params, so we add api_key to them
        # It's safer to build new params, but let's try adding.
        # Alternatively, parse existing params from link_url, add api_key, then rebuild.
        # For simplicity, assuming link_url doesn't have '?' or adding api_key is fine.
        # A robust solution would parse link_url, add/update api_key, then make request.
        
        # Let's assume the link is a base search ID link and we need to add params like api_key
        # However, the example "serpapi_property_details_link": "<SerpApi JSON endpoint>" suggests it's a full JSON endpoint.
        # If it's a full endpoint, it might already have an API key or be a signed URL.
        # For now, let's try calling it directly and add our API key if it doesn't seem to have one.
        
        # Robustly add/update api_key and engine to the link_url
        parsed_link = urlparse(link_url)
        current_query_params = parse_qs(parsed_link.query)
        current_query_params['api_key'] = [google_hotels_client.api_key] # Set/overwrite our api_key
        
        # Ensure 'engine=google_hotels' is present, as it's typically required for SerpApi search endpoints
        if 'engine' not in current_query_params:
            current_query_params['engine'] = ['google_hotels']

        new_query_string = urlencode(current_query_params, doseq=True)
        # Use urlunparse to handle fragments correctly if they exist, though unlikely for API links
        final_url = urlunparse(parsed_link._replace(query=new_query_string))
        
        logging.debug(f"Calling SerpApi direct link (modified): {final_url}")
        response = requests.get(final_url, timeout=10) # Make the request
        response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)
        hotel_detail_data = response.json() # Parse JSON response

        if 'error' in hotel_detail_data: # Check for error messages within a successful JSON response
            logging.error(f"SerpApi link returned error for {link_url}: {hotel_detail_data['error']}")
            return jsonify({"error": "Failed to fetch hotel details from link (API error)"}), 404
        
        logging.debug(f"Raw hotel_detail_data from link {link_url} before transformation: {hotel_detail_data}")
        
        # Reuse the existing transformation logic
        # This part is duplicated from get_hotel_detail_route, consider refactoring to a helper
        prop = hotel_detail_data 
        if 'place_results' in hotel_detail_data:
             prop = hotel_detail_data['place_results']
        elif 'property_data' in hotel_detail_data:
             prop = hotel_detail_data['property_data']

        transformed_hotel = {
            "id": prop.get("property_token") or prop.get("place_id") or "from_link_" + str(random.randint(1000,9999)), # place_id is common in place details
            "name": prop.get("name") or prop.get("title") or "Unknown Hotel",
            "description": prop.get("description") or get_nested(prop, ['summary', 'text']) or "No description available.",
            "location": prop.get("address") or prop.get("formatted_address") or prop.get("localized_address") or "Unknown location",
            "price": get_nested(prop, ['rate_per_night', 'extracted_lowest']) or get_nested(prop, ['prices', 0, 'rate_per_night', 'extracted_lowest']) or 0,
            "rating": prop.get("overall_rating") or prop.get("rating") or 0,
            "images": [img.get("image") or img.get("thumbnail") or img.get("original_image") for img in prop.get("images", []) if img.get("image") or img.get("thumbnail") or img.get("original_image")] or \
                      ([prop.get("thumbnail")] if prop.get("thumbnail") else []),
            "amenities": prop.get("amenities") or []
        }
        if not transformed_hotel["images"]:
            transformed_hotel["images"] = ["/placeholder.svg"]
        
        logging.debug(f"Transformed hotel data from link {link_url} being sent to frontend: {transformed_hotel}")
        logging.info(f"Hotel detail lookup successful from link: {link_url}")
        return jsonify(transformed_hotel), 200

    except requests.exceptions.HTTPError as e:
        logging.error(f"HTTP Error during hotel detail lookup from link {link_url}: {str(e)}. Response text: {e.response.text if e.response else 'No response text'}")
        return jsonify({"error": "Failed to fetch hotel details from link (HTTP error)"}), 404 # Or 500
    except Exception as e:
        logging.error(f"Unexpected error during hotel detail lookup from link {link_url}: {str(e)}. Raw data: {hotel_detail_data if 'hotel_detail_data' in locals() else 'hotel_detail_data not defined'}")
        return jsonify({"error": "Error processing hotel data from link"}), 500


@app.route('/api/bookings', methods=['POST'])
def create_booking():
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['user_id', 'hotel_name', 'hotel_id', 'city', 'check_in', 'check_out', 'room_type', 'total_price']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400
    
    # Process payment (mock)
    payment_data = data.get('payment', {})
    card_number = payment_data.get('card_number')
    expiry = payment_data.get('expiry')
    cvv = payment_data.get('cvv')
    cardholder = payment_data.get('cardholder')
    
    if not all([card_number, expiry, cvv, cardholder]):
        return jsonify({"error": "All payment details are required"}), 400
    
    if len(card_number) != 16 or not is_expiry_valid(expiry) or len(cvv) != 3:
        return jsonify({"error": "Invalid payment details"}), 400
    
    # Create booking
    booking_id = db_manager.save_booking(
        user_id=data['user_id'],
        hotel_name=data['hotel_name'],
        hotel_id=data['hotel_id'],
        city=data['city'],
        check_in=data['check_in'],
        check_out=data['check_out'],
        room_type=data['room_type'],
        total_price=data['total_price']
    )
    
    if booking_id:
        transaction_id = random.randint(100000, 999999)
        return jsonify({
            "message": "Booking successful",
            "booking_id": booking_id,
            "transaction_id": transaction_id
        }), 201
    else:
        return jsonify({"error": "Failed to create booking"}), 500

@app.route('/api/bookings/<int:user_id>', methods=['GET'])
def get_bookings(user_id):
    bookings = db_manager.get_user_bookings(user_id)
    return jsonify(bookings), 200

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    
    # Validate required fields
    if 'message' not in data:
        return jsonify({"error": "Message is required"}), 400
    
    user_input = data['message']
    conversation_history = data.get('conversation_history', [])
    
    # Process with LLM
    if groq_client:
        try:
            # System message to define persona, scope, and conciseness
            system_message_content = (
                "You are a helpful assistant for LuxeStay, a hotel booking application. "
                "Only answer questions related to hotels, bookings, travel, and destinations. "
                "If asked about other topics, politely state that you can only assist with hotel and travel-related queries. "
                "Answer concisely and to the point, only include important information or main points."
            )
            system_message = {"role": "system", "content": system_message_content}
            messages = [system_message] + conversation_history + [{"role": "user", "content": user_input}]
            
            response = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                max_tokens=4096,
                temperature=0.7,
                top_p=0.9
            )
            
            bot_response = response.choices[0].message.content
            if len(bot_response) > 1000:
                bot_response = bot_response[:997] + "..."
                
            return jsonify({"response": bot_response}), 200
        except Exception as e:
            return jsonify({"error": f"Failed to process chat: {str(e)}"}), 500
    else:
        return jsonify({"error": "Chat service is not available"}), 503

if __name__ == '__main__':
    app.run(debug=True)
