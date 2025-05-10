import streamlit as st
import sqlite3
import os
from dotenv import load_dotenv
import requests
from datetime import date, datetime, timedelta
import pandas as pd
from groq import Groq
import re
import logging
import time
import random
import hashlib

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.DEBUG, 
                    format='%(asctime)s - %(levelname)s - %(message)s',
                    filename='hotel_booking_debug.log')

# Custom CSS for better UI
st.markdown("""
    <style>
    .main-title {
        font-size: 36px;
        color: #2c3e50;
        text-align: center;
        margin-bottom: 20px;
    }
    .subheader {
        font-size: 24px;
        color: #34495e;
        margin-top: 20px;
    }
    .stButton>button {
        background-color: #3498db;
        color: white;
        border-radius: 5px;
        padding: 10px 20px;
        font-size: 16px;
        border: none;
    }
    .stButton>button:hover {
        background-color: #2980b9;
    }
    .stButton>button:disabled {
        background-color: #cccccc;
        color: #666666;
        cursor: not-allowed;
    }
    .sidebar .sidebar-content {
        background-color: #ecf0f1;
    }
    .hotel-card {
        background-color: #f9f9f9;
        border-radius: 10px;
        padding: 15px;
        margin-bottom: 15px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .success-message {
        background-color: #e8f5e9;
        color: #2e7d32;
        padding: 10px;
        border-radius: 5px;
        margin-top: 10px;
    }
    .error-message {
        background-color: #ffebee;
        color: #c62828;
        padding: 10px;
        border-radius: 5px;
        margin-top: 10px;
    }
    .info-message {
        background-color: #e3f2fd;
        color: #1565c0;
        padding: 10px;
        border-radius: 5px;
        margin-bottom: 10px;
    }
    .unavailable-message {
        background-color: #fff3cd;
        color: #856404;
        padding: 10px;
        border-radius: 5px;
        margin-top: 10px;
    }
    </style>
""", unsafe_allow_html=True)

# Password hashing function
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

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
            cursor.execute('SELECT * FROM users WHERE username = ? AND password = ?', (username, hashed_password))
            return cursor.fetchone() is not None
        except sqlite3.Error as e:
            logging.error(f"Database error during authentication: {e}")
            return False
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

    def get_user_bookings(self, username):
        conn = sqlite3.connect('hotel_booking.db')
        try:
            cursor = conn.cursor()
            cursor.execute('''
                SELECT b.* FROM bookings b JOIN users u ON b.user_id = u.id
                WHERE u.username = ? ORDER BY b.booking_date DESC
            ''', (username,))
            return cursor.fetchall()
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

# Google Hotels API Client Class
class GoogleHotelsAPIClient:
    BASE_URL = "https://serpapi.com/search.json"

    def __init__(self):
        self.api_key = os.environ.get("SERPAPI_KEY")
        if not self.api_key:
            st.error("SERPAPI_KEY environment variable is not set")
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
                st.error(f"Search failed: {error_message}")
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
            st.error(error_message)
            return None
        except requests.exceptions.Timeout:
            error_message = "Request timed out. Please try again later."
            logging.error(error_message)
            st.error(error_message)
            return None
        except requests.exceptions.ConnectionError:
            error_message = "Connection Error. Please check your internet connection."
            logging.error(error_message)
            st.error(error_message)
            return None
        except requests.exceptions.RequestException as e:
            error_message = f"Request failed: {str(e)}"
            logging.error(error_message)
            st.error(error_message)
            return None
        except ValueError as e:
            error_message = f"Invalid response from API: {str(e)}"
            logging.error(error_message)
            st.error(error_message)
            return None
        except Exception as e:
            error_message = f"Unexpected error: {str(e)}"
            logging.error(error_message)
            st.error(error_message)
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

# Initialize session state
if 'logged_in' not in st.session_state:
    st.session_state['logged_in'] = False
if 'username' not in st.session_state:
    st.session_state['username'] = None
if 'conversation_history' not in st.session_state:
    st.session_state['conversation_history'] = []
if 'booking_state' not in st.session_state:
    st.session_state['booking_state'] = "idle"
if 'booking_params' not in st.session_state:
    st.session_state['booking_params'] = {'destination': None, 'check_in': None, 'check_out': None, 'num_people': None, 'rooms': None}
if 'selected_hotel' not in st.session_state:
    st.session_state['selected_hotel'] = None
if 'search_results' not in st.session_state:
    st.session_state['search_results'] = None
if 'next_page_token' not in st.session_state:
    st.session_state['next_page_token'] = None
if 'show_booking_summary' not in st.session_state:
    st.session_state['show_booking_summary'] = False
if 'show_payment' not in st.session_state:
    st.session_state['show_payment'] = False
if 'show_confirmation' not in st.session_state:
    st.session_state['show_confirmation'] = False
if 'booking_id' not in st.session_state:
    st.session_state['booking_id'] = None
if 'transaction_id' not in st.session_state:
    st.session_state['transaction_id'] = None
if 'current_search_params' not in st.session_state:
    st.session_state['current_search_params'] = None
# Initialize form state variables
if 'form_destination' not in st.session_state:
    st.session_state['form_destination'] = "faridabad"
if 'form_num_people' not in st.session_state:
    st.session_state['form_num_people'] = 2  # Default to 2 people
if 'form_rooms' not in st.session_state:
    st.session_state['form_rooms'] = 1
if 'form_check_in' not in st.session_state:
    st.session_state['form_check_in'] = date.today()
if 'form_check_out' not in st.session_state:
    st.session_state['form_check_out'] = st.session_state['form_check_in'] + timedelta(days=1)
if 'form_sort_by' not in st.session_state:
    st.session_state['form_sort_by'] = "Lowest Price"
if 'form_min_price' not in st.session_state:
    st.session_state['form_min_price'] = 0
if 'form_max_price' not in st.session_state:
    st.session_state['form_max_price'] = 0
if 'form_property_types' not in st.session_state:
    st.session_state['form_property_types'] = []
if 'form_amenities' not in st.session_state:
    st.session_state['form_amenities'] = []
if 'form_rating' not in st.session_state:
    st.session_state['form_rating'] = "Any"
if 'form_brands' not in st.session_state:
    st.session_state['form_brands'] = []
if 'form_hotel_class' not in st.session_state:
    st.session_state['form_hotel_class'] = []
if 'form_free_cancellation' not in st.session_state:
    st.session_state['form_free_cancellation'] = False
if 'form_special_offers' not in st.session_state:
    st.session_state['form_special_offers'] = False
if 'form_eco_certified' not in st.session_state:
    st.session_state['form_eco_certified'] = False
if 'form_vacation_rentals' not in st.session_state:
    st.session_state['form_vacation_rentals'] = False
if 'form_bedrooms' not in st.session_state:
    st.session_state['form_bedrooms'] = 0
if 'form_bathrooms' not in st.session_state:
    st.session_state['form_bathrooms'] = 0
if 'reset_filters_confirm' not in st.session_state:
    st.session_state['reset_filters_confirm'] = False

# Initialize database and API clients
db_manager = DatabaseManager()
try:
    google_hotels_client = GoogleHotelsAPIClient()
except ValueError:
    st.stop()

# Login Page
def login_page():
    st.markdown('<h1 class="main-title">🏨 Hotel Booking System</h1>', unsafe_allow_html=True)
    with st.container():
        st.markdown("### Sign In to Your Account")
        with st.form(key='login_form'):
            username = st.text_input("👤 Username", placeholder="Enter your username")
            password = st.text_input("🔒 Password", type="password", placeholder="Enter your password")
            col1, col2 = st.columns(2)
            with col1:
                if st.form_submit_button("Login"):
                    if not username or not password:
                        st.markdown('<div class="error-message">Please enter both username and password</div>', unsafe_allow_html=True)
                    elif db_manager.authenticate_user(username, password):
                        st.session_state['logged_in'] = True
                        st.session_state['username'] = username
                        st.rerun()
                    else:
                        st.markdown('<div class="error-message">Invalid username or password</div>', unsafe_allow_html=True)
            with col2:
                if st.form_submit_button("Register"):
                    st.session_state['show_register'] = True

    if st.session_state.get('show_register', False):
        st.markdown("### Create a New Account")
        with st.form(key='register_form'):
            full_name = st.text_input("📛 Full Name", placeholder="Enter your full name")
            reg_username = st.text_input("👤 Username", placeholder="Choose a username")
            email = st.text_input("📧 Email", placeholder="Enter your email")
            reg_password = st.text_input("🔒 Password", type="password", placeholder="Create a password")
            confirm_password = st.text_input("🔒 Confirm Password", type="password", placeholder="Confirm your password")
            if st.form_submit_button("Register"):
                error = None
                if not all([full_name, reg_username, email, reg_password, confirm_password]):
                    error = "All fields are required"
                elif len(reg_username) < 4:
                    error = "Username must be at least 4 characters long"
                elif not re.match(r'^[a-zA-Z0-9_]+$', reg_username):
                    error = "Username can only contain letters, numbers, and underscores"
                elif reg_password != confirm_password:
                    error = "Passwords do not match"
                elif not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
                    error = "Invalid email format (e.g., user@example.com)"
                elif len(reg_password) < 8:
                    error = "Password must be at least 8 characters long"
                elif not re.search(r'[A-Z]', reg_password) or not re.search(r'[a-z]', reg_password) or not re.search(r'[0-9]', reg_password):
                    error = "Password must contain at least one uppercase letter, one lowercase letter, and one number"
                
                if error:
                    st.markdown(f'<div class="error-message">{error}</div>', unsafe_allow_html=True)
                elif db_manager.register_user(reg_username, reg_password, email, full_name):
                    st.markdown('<div class="success-message">Registration successful! Please log in.</div>', unsafe_allow_html=True)
                    st.session_state['show_register'] = False
                else:
                    st.markdown('<div class="error-message">Username or email already exists</div>', unsafe_allow_html=True)

# Main App
def main_app():
    st.markdown(f'<h1 class="main-title">🏨 Welcome, {st.session_state["username"]}!</h1>', unsafe_allow_html=True)
    
    with st.sidebar:
        st.markdown("### Navigation 🧭")
        page = st.selectbox("Go to", ["🏠 Search Hotels", "📜 My Bookings", "💬 Chat with Bot", "🚪 Logout"])
        if page == "🚪 Logout":
            if st.button("Confirm Logout", key="logout_button"):
                st.session_state.clear()
                st.rerun()

    groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
    if not groq_client.api_key:
        st.error("GROQ_API_KEY environment variable is not set")
        st.stop()

    if page == "🏠 Search Hotels":
        search_hotels_page(google_hotels_client)
    elif page == "📜 My Bookings":
        my_bookings_page()
    elif page == "💬 Chat with Bot":
        chat_page(groq_client)

# Function to check room availability (mock implementation)
def check_room_availability(hotel):
    extracted_rate = hotel.get('total_rate', {}).get('extracted_lowest', None)
    return extracted_rate is not None

# Search Hotels Page
def search_hotels_page(google_hotels_client):
    if st.session_state.get('show_booking_summary', False) and st.session_state['selected_hotel']:
        show_booking_summary()
        return
    elif st.session_state.get('show_payment', False) and st.session_state['selected_hotel']:
        show_payment_page()
        return
    elif st.session_state.get('show_confirmation', False):
        show_confirmation_page()
        return

    st.markdown('<h2 class="subheader">🔍 Search for Hotels</h2>', unsafe_allow_html=True)

    with st.form(key='search_form'):
        st.markdown("#### 📋 Basic Search")
        col1, col2 = st.columns(2)
        with col1:
            destination = st.text_input("🌍 Destination", value=st.session_state['form_destination'], placeholder="e.g., Faridabad")
            num_people = st.number_input("👥 Number of People", min_value=1, max_value=8, value=st.session_state['form_num_people'])
        with col2:
            rooms = st.number_input("🛏️ Number of Rooms", min_value=1, max_value=5, value=st.session_state['form_rooms'])

        st.markdown("#### 📅 Dates")
        col3, col4 = st.columns(2)
        with col3:
            today = date.today()
            check_in = st.date_input("📅 Check-in Date", min_value=today, value=st.session_state['form_check_in'])
        with col4:
            min_check_out = check_in + timedelta(days=1)
            if st.session_state['form_check_out'] < min_check_out:
                st.session_state['form_check_out'] = min_check_out
            check_out = st.date_input("📅 Check-out Date", min_value=min_check_out, value=st.session_state['form_check_out'])

        with st.expander("🌐 Advanced Search Options"):
            st.markdown("#### Filters")
            sort_by = st.selectbox("📊 Sort By", ["Relevance", "Lowest Price", "Highest Rating", "Most Reviewed"], index=["Relevance", "Lowest Price", "Highest Rating", "Most Reviewed"].index(st.session_state['form_sort_by']))
            col5, col6 = st.columns(2)
            with col5:
                min_price = st.number_input("💰 Min Price (₹)", min_value=0, value=st.session_state['form_min_price'])
            with col6:
                max_price = st.number_input("💰 Max Price (₹)", min_value=0, value=st.session_state['form_max_price'])
            property_types = st.multiselect("🏡 Property Types", ["Hotel (17)", "Vacation Rental (12)", "Apartment (18)"], default=st.session_state['form_property_types'])
            amenities = st.multiselect("🛠️ Amenities", ["Free Wi-Fi (35)", "Pool (9)", "Free Breakfast (19)"], default=st.session_state['form_amenities'])
            rating = st.selectbox("⭐ Minimum Rating", ["Any", "3.5+", "4.0+", "4.5+"], index=["Any", "3.5+", "4.0+", "4.5+"].index(st.session_state['form_rating']))

            st.markdown("#### Hotel Filters")
            brands = st.multiselect("🏢 Brands", ["Accor (33)", "Banyan Tree (67)"], default=st.session_state['form_brands'])
            hotel_class = st.multiselect("🌟 Hotel Class", ["2-star (2)", "3-star (3)", "4-star (4)", "5-star (5)"], default=st.session_state['form_hotel_class'])
            free_cancellation = st.checkbox("✅ Free Cancellation", value=st.session_state['form_free_cancellation'])
            special_offers = st.checkbox("🎉 Special Offers", value=st.session_state['form_special_offers'])
            eco_certified = st.checkbox("🌿 Eco Certified", value=st.session_state['form_eco_certified'])

            st.markdown("#### Vacation Rental Filters")
            vacation_rentals = st.checkbox("🏖️ Vacation Rentals", value=st.session_state['form_vacation_rentals'])
            if vacation_rentals:
                col7, col8 = st.columns(2)
                with col7:
                    bedrooms = st.number_input("🛏️ Min Bedrooms", min_value=0, value=st.session_state['form_bedrooms'])
                with col8:
                    bathrooms = st.number_input("🛁 Min Bathrooms", min_value=0, value=st.session_state['form_bathrooms'])
                if free_cancellation or special_offers:
                    st.info("Free Cancellation and Special Offers filters are not available for Vacation Rentals.")

            st.markdown("#### Reset Advanced Filters")
            st.markdown("Click the button below to reset all advanced filters to their default values:")
            reset_filters = st.form_submit_button("🔄 Reset Filters")

        st.markdown("#### Form Actions")
        col9, col10 = st.columns(2)
        with col9:
            submit = st.form_submit_button("🔍 Search Hotels")
        with col10:
            clear_form = st.form_submit_button("🗑️ Clear Form")

    if clear_form:
        st.session_state['form_destination'] = "faridabad"
        st.session_state['form_num_people'] = 2
        st.session_state['form_rooms'] = 1
        st.session_state['form_check_in'] = date.today()
        st.session_state['form_check_out'] = date.today() + timedelta(days=1)
        st.session_state['form_sort_by'] = "Lowest Price"
        st.session_state['form_min_price'] = 0
        st.session_state['form_max_price'] = 0
        st.session_state['form_property_types'] = []
        st.session_state['form_amenities'] = []
        st.session_state['form_rating'] = "Any"
        st.session_state['form_brands'] = []
        st.session_state['form_hotel_class'] = []
        st.session_state['form_free_cancellation'] = False
        st.session_state['form_special_offers'] = False
        st.session_state['form_eco_certified'] = False
        st.session_state['form_vacation_rentals'] = False
        st.session_state['form_bedrooms'] = 0
        st.session_state['form_bathrooms'] = 0
        st.session_state['reset_filters_confirm'] = False
        st.rerun()

    if reset_filters:
        st.session_state['reset_filters_confirm'] = True

    if st.session_state['reset_filters_confirm']:
        if st.checkbox("✅ Confirm Reset", key="confirm_reset"):
            st.session_state['form_sort_by'] = "Lowest Price"
            st.session_state['form_min_price'] = 0
            st.session_state['form_max_price'] = 0
            st.session_state['form_property_types'] = []
            st.session_state['form_amenities'] = []
            st.session_state['form_rating'] = "Any"
            st.session_state['form_brands'] = []
            st.session_state['form_hotel_class'] = []
            st.session_state['form_free_cancellation'] = False
            st.session_state['form_special_offers'] = False
            st.session_state['form_eco_certified'] = False
            st.session_state['form_vacation_rentals'] = False
            st.session_state['form_bedrooms'] = 0
            st.session_state['form_bathrooms'] = 0
            st.session_state['reset_filters_confirm'] = False
            st.rerun()
        else:
            st.session_state['reset_filters_confirm'] = False

    if submit and destination:
        if check_out <= check_in:
            st.markdown('<div class="error-message">Check-out date must be at least one day after the check-in date.</div>', unsafe_allow_html=True)
            return

        st.session_state['form_destination'] = destination
        st.session_state['form_num_people'] = num_people
        st.session_state['form_rooms'] = rooms
        st.session_state['form_check_in'] = check_in
        st.session_state['form_check_out'] = check_out
        st.session_state['form_sort_by'] = sort_by
        st.session_state['form_min_price'] = min_price
        st.session_state['form_max_price'] = max_price
        st.session_state['form_property_types'] = property_types
        st.session_state['form_amenities'] = amenities
        st.session_state['form_rating'] = rating
        st.session_state['form_brands'] = brands
        st.session_state['form_hotel_class'] = hotel_class
        st.session_state['form_free_cancellation'] = free_cancellation
        st.session_state['form_special_offers'] = special_offers
        st.session_state['form_eco_certified'] = eco_certified
        st.session_state['form_vacation_rentals'] = vacation_rentals
        st.session_state['form_bedrooms'] = bedrooms if vacation_rentals else 0
        st.session_state['form_bathrooms'] = bathrooms if vacation_rentals else 0

        sort_by_map = {"Relevance": None, "Lowest Price": "3", "Highest Rating": "8", "Most Reviewed": "13"}
        rating_map = {"Any": None, "3.5+": "7", "4.0+": "8", "4.5+": "9"}
        property_types_map = {"Hotel (17)": "17", "Vacation Rental (12)": "12", "Apartment (18)": "18"}
        amenities_map = {"Free Wi-Fi (35)": "35", "Pool (9)": "9", "Free Breakfast (19)": "19"}
        brands_map = {"Accor (33)": "33", "Banyan Tree (67)": "67"}
        hotel_class_map = {"2-star (2)": "2", "3-star (3)": "3", "4-star (4)": "4", "5-star (5)": "5"}

        search_params = {
            "q": destination,
            "check_in_date": check_in.strftime("%Y-%m-%d"),
            "check_out_date": check_out.strftime("%Y-%m-%d"),
            "adults": num_people,  # Map num_people to adults
            "sort_by": sort_by_map[sort_by],
            "min_price": min_price if min_price > 0 else None,
            "max_price": max_price if max_price > 0 else None,
            "property_types": ",".join([property_types_map[pt] for pt in property_types]) if property_types else None,
            "amenities": ",".join([amenities_map[a] for a in amenities]) if amenities else None,
            "rating": rating_map[rating],
            "brands": ",".join([brands_map[b] for b in brands]) if brands else None,
            "hotel_class": ",".join([hotel_class_map[hc] for hc in hotel_class]) if hotel_class else None,
            "eco_certified": "true" if eco_certified else None,
            "vacation_rentals": "true" if vacation_rentals else None,
            "bedrooms": bedrooms if vacation_rentals and bedrooms > 0 else None,
            "bathrooms": bathrooms if vacation_rentals and bathrooms > 0 else None,
        }
        
        if not vacation_rentals:
            if free_cancellation:
                search_params["free_cancellation"] = "true"
            if special_offers:
                search_params["special_offers"] = "true"

        with st.spinner("Searching for hotels..."):
            search_results = google_hotels_client.search_hotels(**search_params)
            if search_results:
                properties = search_results.get("properties", [])
                st.session_state['search_results'] = properties
                st.session_state['next_page_token'] = search_results.get("serpapi_pagination", {}).get("next_page_token")
                st.session_state['booking_params'] = {
                    'destination': destination,
                    'check_in': check_in,
                    'check_out': check_out,
                    'num_people': num_people,
                    'rooms': rooms
                }
                st.session_state['current_search_params'] = search_params
                if not properties:
                    st.info("No hotels found matching your criteria. Try adjusting your search parameters.")

    if st.session_state.get('search_results'):
        current_destination = st.session_state.get('booking_params', {}).get('destination', 'your search')
        st.markdown(f'<h2 class="subheader">🏨 Hotels in {current_destination}</h2>', unsafe_allow_html=True)
        with st.spinner("Loading search results..."):
            for prop in st.session_state['search_results']:
                with st.container():
                    st.markdown('<div class="hotel-card">', unsafe_allow_html=True)
                    col1, col2, col3, col4 = st.columns([1, 2, 1, 1])
                    with col1:
                        if 'images' in prop and prop['images']:
                            st.image(prop['images'][0]['thumbnail'], width=100)
                        else:
                            st.write("No image")
                    with col2:
                        st.markdown(f"**{prop['name']}**")
                        st.write(f"⭐ Rating: {prop.get('overall_rating', 'N/A')}")
                    with col3:
                        extracted_rate = prop.get('total_rate', {}).get('extracted_lowest', None)
                        displayed_rate = prop.get('total_rate', {}).get('lowest', 'N/A')
                        if extracted_rate:
                            st.write(f"💰 Total Rate: ₹{extracted_rate:.2f}")
                        else:
                            st.write(f"💰 Total Rate: {displayed_rate}")
                    with col4:
                        rooms_available = check_room_availability(prop)
                        if rooms_available:
                            if st.button("📅 Book Now", key=f"book_{prop['property_token']}"):
                                st.session_state['selected_hotel'] = prop
                                st.session_state['show_booking_summary'] = True
                                st.session_state['show_payment'] = False
                                st.session_state['show_confirmation'] = False
                                st.rerun()
                        else:
                            st.button("📅 Book Now", key=f"book_{prop['property_token']}", disabled=True)
                            st.markdown('<div class="unavailable-message">No rooms available for your dates.</div>', unsafe_allow_html=True)
                    st.markdown('</div>', unsafe_allow_html=True)

        if st.session_state['next_page_token']:
            if st.button("📄 Load Next Page", key="load_next_page"):
                search_params = st.session_state['current_search_params']
                search_params['next_page_token'] = st.session_state['next_page_token']
                with st.spinner("Loading more hotels..."):
                    search_results = google_hotels_client.search_hotels(**search_params)
                    if search_results:
                        properties = search_results.get("properties", [])
                        st.session_state['search_results'].extend(properties)
                        st.session_state['next_page_token'] = search_results.get("serpapi_pagination", {}).get("next_page_token")
                        st.rerun()

        if len(st.session_state['search_results']) > 5:
            if st.button("⬆️ Back to Top", key="back_to_top"):
                st.markdown('<script>window.scrollTo(0, 0);</script>', unsafe_allow_html=True)

# Separate functions for different booking stages
def show_booking_summary():
    hotel_data = st.session_state['selected_hotel']
    params = st.session_state['booking_params']
    if not check_room_availability(hotel_data):
        st.markdown('<div class="error-message">Sorry, no rooms are available for this hotel anymore. Please select another hotel.</div>', unsafe_allow_html=True)
        if st.button("⬅️ Back to Search", key="back_to_search_from_summary_unavailable"):
            st.session_state['show_booking_summary'] = False
            st.session_state['selected_hotel'] = None
            st.rerun()
        return

    st.markdown('<h2 class="subheader">📝 Booking Summary</h2>', unsafe_allow_html=True)
    with st.container():
        st.markdown('<div class="hotel-card">', unsafe_allow_html=True)
        st.write(f"🏨 **Hotel**: {hotel_data['name']}")
        st.write(f"🌍 **Destination**: {params['destination']}")
        st.write(f"📅 **Check-in**: {params['check_in'].strftime('%Y-%m-%d')}")
        st.write(f"📅 **Check-out**: {params['check_out'].strftime('%Y-%m-%d')}")
        nights = (params['check_out'] - params['check_in']).days
        st.write(f"🌙 **Nights**: {nights}")
        st.write(f"👥 **Number of People**: {params['num_people']}")
        rooms = st.number_input("🛏️ Number of Rooms", min_value=1, max_value=5, value=params['rooms'])
        total_rate = hotel_data.get('total_rate', {}).get('extracted_lowest', 0.0)
        total_price = total_rate * rooms if total_rate else 0.0
        st.markdown(f"💰 **Total Price for {rooms} room(s)**: ₹{total_price:.2f}")
        st.markdown('</div>', unsafe_allow_html=True)

        col1, col2 = st.columns(2)
        with col1:
            if st.button("💳 Proceed to Payment", key="proceed_to_payment"):
                st.session_state['show_payment'] = True
                st.session_state['show_booking_summary'] = False
                st.session_state['rooms'] = rooms
                st.session_state['total_price'] = total_price
                st.rerun()
        with col2:
            if st.button("⬅️ Back to Search", key="back_to_search_from_summary"):
                st.session_state['show_booking_summary'] = False
                st.session_state['selected_hotel'] = None
                st.rerun()

def show_payment_page():
    hotel_data = st.session_state['selected_hotel']
    if not check_room_availability(hotel_data):
        st.markdown('<div class="error-message">Sorry, no rooms are available for this hotel anymore. Please select another hotel.</div>', unsafe_allow_html=True)
        if st.button("⬅️ Back to Search", key="back_to_search_from_payment_unavailable"):
            st.session_state['show_payment'] = False
            st.session_state['selected_hotel'] = None
            st.rerun()
        return

    rooms = st.session_state.get('rooms', 1)
    total_price = st.session_state.get('total_price', 0.0)
    params = st.session_state['booking_params']
    st.markdown(f'<h2 class="subheader">💳 Payment for {hotel_data["name"]}</h2>', unsafe_allow_html=True)
    st.markdown(f"💰 **Total Price**: ₹{total_price:.2f} for {rooms} room(s)")

    back_button = st.button("⬅️ Back to Booking Summary", key="back_from_payment")
    if back_button:
        st.session_state['show_payment'] = False
        st.session_state['show_booking_summary'] = True
        st.rerun()

    with st.form(key='payment_form'):
        st.markdown("#### Payment Simulation")
        card_number = st.text_input("💳 Card Number", max_chars=16, placeholder="1234567890123456")
        expiry = st.text_input("📅 Expiry Date (MM/YY)", max_chars=5, placeholder="12/25")
        cvv = st.text_input("🔒 CVV", max_chars=3, type="password", placeholder="123")
        cardholder = st.text_input("👤 Cardholder Name", placeholder="John Doe")
        pay = st.form_submit_button("✅ Pay Now")
        if pay:
            if len(card_number) != 16 or not is_expiry_valid(expiry) or len(cvv) != 3 or not cardholder:
                st.markdown('<div class="error-message">Invalid payment details. Please use a 16-digit card number, MM/YY expiry format, 3-digit CVV, and enter the cardholder name.</div>', unsafe_allow_html=True)
            else:
                with st.spinner("Processing payment..."):
                    time.sleep(2)
                transaction_id = random.randint(100000, 999999)
                booking_id = db_manager.save_booking(
                    user_id=db_manager.get_user_id(st.session_state['username']),
                    hotel_name=hotel_data['name'],
                    hotel_id=hotel_data['property_token'],
                    city=params['destination'],
                    check_in=params['check_in'].strftime("%Y-%m-%d"),
                    check_out=params['check_out'].strftime("%Y-%m-%d"),
                    room_type="Standard Room",
                    total_price=total_price
                )
                if booking_id:
                    st.session_state['transaction_id'] = transaction_id
                    st.session_state['booking_id'] = booking_id
                    st.session_state['show_payment'] = False
                    st.session_state['show_confirmation'] = True
                    st.session_state['selected_hotel'] = None
                    st.rerun()
                else:
                    st.markdown('<div class="error-message">Failed to save booking. Please try again.</div>', unsafe_allow_html=True)

def show_confirmation_page():
    st.markdown('<h2 class="subheader">🎉 Booking Confirmed!</h2>', unsafe_allow_html=True)
    with st.container():
        st.markdown('<div class="success-message">', unsafe_allow_html=True)
        st.write(f"✅ **Booking ID**: {st.session_state['booking_id']}")
        st.write(f"💳 **Transaction ID**: {st.session_state['transaction_id']}")
        st.write("Thank you for booking with us! You'll receive a confirmation email shortly.")
        st.markdown('</div>', unsafe_allow_html=True)
        if st.button("🏠 Back to Search", key="back_to_search_from_confirmation"):
            st.session_state['show_confirmation'] = False
            st.rerun()

# My Bookings Page
def my_bookings_page():
    st.markdown('<h2 class="subheader">📜 My Bookings</h2>', unsafe_allow_html=True)
    bookings = db_manager.get_user_bookings(st.session_state['username'])
    if not bookings:
        st.info("You have no bookings yet. Start by searching for a hotel!")
    else:
        data = [{"ID": b[0], "Hotel": b[2], "City": b[3], "Check-in": b[4], "Check-out": b[5], "Total Price": f"₹{b[7]:.2f}"} 
                for b in bookings]
        st.dataframe(pd.DataFrame(data), use_container_width=True)

# Chat Page
def chat_page(groq_client):
    st.markdown('<h2 class="subheader">💬 Chat with Travel Bot</h2>', unsafe_allow_html=True)

    chat_container = st.container()
    with chat_container:
        for msg in st.session_state['conversation_history']:
            with st.chat_message(msg["role"]):
                st.write(msg["content"])

    if not st.session_state['conversation_history']:
        st.session_state['conversation_history'].append({"role": "assistant", "content": 
            "Hi! I'm your travel assistant. How can I help you today?"})
        st.rerun()

    user_input = st.chat_input("Type your message here...")
    if user_input:
        st.session_state['conversation_history'].append({"role": "user", "content": user_input})

        with chat_container:
            with st.chat_message("user"):
                st.write(user_input)

        with st.spinner("Bot is thinking..."):
            if st.session_state['booking_state'] == "idle":
                if "book" in user_input.lower() and "hotel" in user_input.lower():
                    st.session_state['booking_state'] = "destination"
                    bot_response = "Sure! What is your destination?"
                    st.session_state['conversation_history'].append({"role": "assistant", "content": bot_response})
                elif not is_hotel_or_travel_related(user_input):
                    bot_response = "I do not have access to this information. I can only assist with hotel and travel-related topics."
                    st.session_state['conversation_history'].append({"role": "assistant", "content": bot_response})
                else:
                    try:
                        # Insert system message for concise answers
                        concise_system_message = {"role": "system", "content": "Answer concisely and to the point, only include important information or main points."}
                        messages = [concise_system_message] + st.session_state['conversation_history']
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
                        st.session_state['conversation_history'].append({"role": "assistant", "content": bot_response})
                    except Exception as e:
                        bot_response = f"Sorry, I couldn't process your request due to an error: {str(e)}"
                        st.session_state['conversation_history'].append({"role": "assistant", "content": bot_response})
            else:
                bot_response = handle_booking_chat(user_input, google_hotels_client)

        with chat_container:
            with st.chat_message("assistant"):
                st.write(bot_response)

    if st.button("🗑️ Clear Chat", key="clear_chat_button"):
        st.session_state['conversation_history'] = [{"role": "assistant", "content": "Conversation cleared."}]
        st.session_state['booking_state'] = "idle"
        st.rerun()

# Handle Booking Chat Logic
def handle_booking_chat(user_input, google_hotels_client):
    if user_input.lower() in ["cancel", "stop"]:
        st.session_state['booking_state'] = "idle"
        st.session_state['booking_params'] = {k: None for k in st.session_state['booking_params']}
        return "Booking cancelled."
    elif st.session_state['booking_state'] == "destination":
        st.session_state['booking_params']['destination'] = user_input
        st.session_state['booking_state'] = "check_in"
        return "When do you want to check in? (YYYY-MM-DD)"
    elif st.session_state['booking_state'] == "check_in":
        try:
            check_in = date.fromisoformat(user_input)
            if check_in < date.today():
                return "Check-in date must be today or in the future."
            else:
                st.session_state['booking_params']['check_in'] = check_in
                st.session_state['booking_state'] = "check_out"
                return "When do you want to check out? (YYYY-MM-DD)"
        except ValueError:
            return "Invalid date format. Please use YYYY-MM-DD (e.g., 2025-03-26)."
    elif st.session_state['booking_state'] == "check_out":
        try:
            check_out = date.fromisoformat(user_input)
            if check_out <= st.session_state['booking_params']['check_in']:
                return "Check-out date must be at least one day after the check-in date."
            else:
                st.session_state['booking_params']['check_out'] = check_out
                st.session_state['booking_state'] = "num_people"
                return "How many people are staying? (1-8)"
        except ValueError:
            return "Invalid date format. Please use YYYY-MM-DD (e.g., 2025-03-26)."
    elif st.session_state['booking_state'] == "num_people":
        try:
            num_people = int(user_input)
            if num_people < 1 or num_people > 8:
                return "Number of people must be between 1 and 8."
            else:
                st.session_state['booking_params']['num_people'] = num_people
                st.session_state['booking_state'] = "rooms"
                return "How many rooms do you need? (1-5)"
        except ValueError:
            return "Please enter a valid number (e.g., 2)."
    elif st.session_state['booking_state'] == "rooms":
        try:
            rooms = int(user_input)
            if rooms < 1 or rooms > 5:
                return "Number of rooms must be between 1 and 5."
            else:
                st.session_state['booking_params']['rooms'] = rooms
                st.session_state['booking_state'] = "idle"
                search_results = google_hotels_client.search_hotels(
                    q=st.session_state['booking_params']['destination'],
                    check_in_date=st.session_state['booking_params']['check_in'].strftime("%Y-%m-%d"),
                    check_out_date=st.session_state['booking_params']['check_out'].strftime("%Y-%m-%d"),
                    adults=st.session_state['booking_params']['num_people']
                )
                st.session_state['search_results'] = search_results.get("properties", []) if search_results else []
                st.session_state['booking_params'] = {k: None for k in st.session_state['booking_params']}
                return "Check the 'Search Hotels' page for results."
        except ValueError:
            return "Please enter a valid number (e.g., 1)."

# Payment Validation Helper
def is_expiry_valid(expiry):
    try:
        month, year = map(int, expiry.split('/'))
        current_year = date.today().year % 100
        current_month = date.today().month
        return 1 <= month <= 12 and (year > current_year or (year == current_year and month >= current_month))
    except:
        return False

# Run the app
if not st.session_state['logged_in']:
    login_page()
else:
    main_app()