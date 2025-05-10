// Real API service connecting to the backend

// Types
export interface Hotel {
  id: string;
  name: string;
  description: string;
  location: string;
  price: number;
  rating: number;
  images: string[];
  amenities: string[];
}

export interface SearchParams {
  destination?: string;
  check_in_date?: string;
  check_out_date?: string;
  adults?: number;
  sort_by?: string;
  min_price?: number;
  max_price?: number;
  property_types?: string;
  amenities?: string;
  rating?: string;
  brands?: string;
  hotel_class?: string;
  eco_certified?: boolean;
  vacation_rentals?: boolean;
  bedrooms?: number;
  bathrooms?: number;
  free_cancellation?: boolean;
  special_offers?: boolean;
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
}

export interface Booking {
  id: number;
  user_id: number;
  hotel_name: string;
  city: string;
  check_in: string;
  check_out: string;
  room_type: string;
  total_price: number;
  booking_date: string;
  hotel_id: string;
}

export interface PaymentDetails {
  card_number: string;
  expiry: string;
  cvv: string;
  cardholder: string;
}

// API base URL - can be overridden by environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function for API requests
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API request failed with status ${response.status}`);
    }

    return await response.json() as T;
  } catch (error) {
    console.error(`API error for ${endpoint}:`, error);
    throw error;
  }
}

// Authentication APIs
export const loginUser = async (username: string, password: string): Promise<{ message: string, user: User }> => {
  return apiRequest('/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
};

export const registerUser = async (
  username: string, 
  password: string, 
  email: string, 
  full_name: string
): Promise<{ message: string }> => {
  return apiRequest('/register', {
    method: 'POST',
    body: JSON.stringify({ username, password, email, full_name }),
  });
};

// Hotel Search API
export const searchHotels = async (params: SearchParams) => {
  // Construct query parameters
  const queryParams = new URLSearchParams();
  
  // Map frontend searchParams to backend API expectations
  if (params.destination) queryParams.set('destination', params.destination);
  if (params.check_in_date) queryParams.set('check_in_date', params.check_in_date);
  if (params.check_out_date) queryParams.set('check_out_date', params.check_out_date);
  if (params.adults) queryParams.set('adults', params.adults.toString());
  
  // Add optional parameters if they exist
  if (params.sort_by) queryParams.set('sort_by', params.sort_by);
  if (params.min_price && params.min_price > 0) queryParams.set('min_price', params.min_price.toString());
  if (params.max_price && params.max_price > 0) queryParams.set('max_price', params.max_price.toString());
  if (params.property_types) queryParams.set('property_types', params.property_types);
  if (params.amenities) queryParams.set('amenities', params.amenities);
  if (params.rating) queryParams.set('rating', params.rating);
  if (params.brands) queryParams.set('brands', params.brands);
  if (params.hotel_class) queryParams.set('hotel_class', params.hotel_class);
  
  if (params.eco_certified) queryParams.set('eco_certified', 'true');
  if (params.vacation_rentals) queryParams.set('vacation_rentals', 'true');
  if (params.free_cancellation) queryParams.set('free_cancellation', 'true');
  if (params.special_offers) queryParams.set('special_offers', 'true');
  
  if (params.bedrooms && params.bedrooms > 0) queryParams.set('bedrooms', params.bedrooms.toString());
  if (params.bathrooms && params.bathrooms > 0) queryParams.set('bathrooms', params.bathrooms.toString());

  // Make the API request
  const result = await apiRequest<any>(`/hotels/search?${queryParams.toString()}`);
  
  // Transform the response to match our frontend Hotel interface
  if (result.properties && Array.isArray(result.properties)) {
    return result.properties.map((property: any) => {
      return {
        id: property.property_token || property.id || String(Math.random()),
        name: property.name || 'Unknown Hotel',
        description: property.description || property.snippet || 'No description available',
        location: property.city || property.address || 'Unknown location',
        price: property.total_rate?.extracted_lowest || 0,
        rating: property.overall_rating || 0,
        images: property.images ? property.images.map((img: any) => img.thumbnail || img.link) : [],
        amenities: property.amenities || []
      };
    });
  }
  
  return [];
};

// Single Hotel Detail (using search results since the API doesn't have a single hotel endpoint)
export const getHotelById = async (id: string): Promise<Hotel | undefined> => {
  // Since the backend doesn't have a specific endpoint for a single hotel,
  // we're using the search API and filtering by the hotel ID
  const results = await searchHotels({ destination: '' });
  return results.find(hotel => hotel.id === id);
};

// Bookings APIs
export const getUserBookings = async (userId: number): Promise<Booking[]> => {
  return apiRequest<Booking[]>(`/bookings/${userId}`);
};

export const createBooking = async (
  user_id: number,
  hotel_name: string,
  hotel_id: string,
  city: string,
  check_in: string,
  check_out: string,
  room_type: string,
  total_price: number,
  payment: PaymentDetails
): Promise<{ message: string, booking_id: number, transaction_id: number }> => {
  return apiRequest('/bookings', {
    method: 'POST',
    body: JSON.stringify({
      user_id,
      hotel_name,
      hotel_id,
      city,
      check_in,
      check_out,
      room_type,
      total_price,
      payment
    }),
  });
};

// Chat API
export interface ChatMessage {
  role: string;
  content: string;
}

export const sendChatMessage = async (
  message: string, 
  conversation_history: ChatMessage[] = []
): Promise<{ response: string }> => {
  return apiRequest('/chat', {
    method: 'POST',
    body: JSON.stringify({ message, conversation_history }),
  });
}; 