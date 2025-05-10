
import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom'; // Added useLocation
import { motion } from 'framer-motion';
import { Hotel, getHotelDetailsByToken, createBooking, getHotelDetailsBySerpLink } from '@/lib/api'; // Added getHotelDetailsBySerpLink
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input'; // Added Input import
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  CalendarIcon, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Star, 
  Users 
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, addDays, differenceInCalendarDays } from 'date-fns';
import AnimatedTransition from '@/components/ui/AnimatedTransition'; // Re-enable AnimatedTransition
import { useAuth } from '@/hooks/useAuth';

const HotelDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [checkIn, setCheckIn] = useState<Date>(new Date());
  const [checkOut, setCheckOut] = useState<Date>(addDays(new Date(), 3));
  const [guests, setGuests] = useState("2");
  const [isBooking, setIsBooking] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false); 
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth(); 
  const navigate = useNavigate();

  // Payment form states
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState(''); // MM/YY
  const [cvv, setCvv] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');

  const location = useLocation(); // Import useLocation

  useEffect(() => {
    if (!id) return;

    const fetchHotel = async () => {
      setIsLoading(true);
      let hotelData: Hotel | undefined = undefined;
      const state = location.state as { serpapi_property_details_link?: string }; // Type assertion for state
      const serpLink = state?.serpapi_property_details_link;

      try {
        if (serpLink) {
          console.log("Attempting to fetch hotel details using SerpLink:", serpLink);
          hotelData = await getHotelDetailsBySerpLink(serpLink);
        }
        
        if (!hotelData) {
          // Fallback or primary fetch if no link or link fetch failed
          console.log("SerpLink fetch failed or no link, falling back to fetch by token:", id);
          const formattedCheckIn = format(checkIn, 'yyyy-MM-dd');
          const formattedCheckOut = format(checkOut, 'yyyy-MM-dd');
          hotelData = await getHotelDetailsByToken(id, formattedCheckIn, formattedCheckOut);
        }

        if (hotelData && Object.keys(hotelData).length > 0) {
          setHotel(hotelData);
        } else {
          // If getHotelDetailsByToken returns undefined, null, or an empty object
          setHotel(null); // Ensure hotel state is null so "Hotel Not Found" is shown
          console.log("Setting hotel to null. hotelData received:", hotelData);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load hotel details or hotel not found.",
          });
        }
      } catch (error) { // This catch is for network/unhandled errors from apiRequest
        console.error('Error fetching hotel:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load hotel details. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchHotel();
  }, [id, toast, location.state, checkIn, checkOut]); // Added location.state, checkIn, checkOut to dependencies

  const handleBooking = async () => { // This will now toggle payment form
    if (!hotel || !id || !user) { 
        toast({ title: "Error", description: "User or hotel data missing.", variant: "destructive" });
        return;
    }
    if (!isAuthenticated) {
      toast({ title: "Authentication required", description: "Please login to book a hotel", variant: "destructive" });
      navigate("/login", { state: { from: `/hotel/${id}` } });
      return;
    }
    setShowPaymentForm(true); // Show payment form instead of direct booking
  };

  const handlePaymentSubmit = async (paymentDetails: any) => { // New function for actual booking
    if (!hotel || !id || !user) return;
    
    setIsBooking(true);
    const nightsStay = differenceInCalendarDays(checkOut, checkIn);
    const basePrice = (typeof hotel.price === 'number' ? hotel.price : 0) * nightsStay;
    const cleaningFee = 50; 
    const serviceFee = 30;  
    const calculatedTotalPrice = basePrice + cleaningFee + serviceFee;

    try {
      await createBooking(
        user.id, hotel.name, hotel.id, hotel.location,
        format(checkIn, 'yyyy-MM-dd'), format(checkOut, 'yyyy-MM-dd'),
        "Standard Room", calculatedTotalPrice, paymentDetails
      );
      toast({ title: "Booking confirmed!", description: `Your stay at ${hotel.name} has been booked.` });
      setShowPaymentForm(false); // Hide payment form
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({ variant: "destructive", title: "Booking failed", description: "There was an error. Please try again." });
    } finally {
      setIsBooking(false);
    }
  };

  // Navigate between images
  const nextImage = () => {
    if (!hotel) return;
    setActiveImageIndex((prev) => (prev + 1) % hotel.images.length);
  };

  const prevImage = () => {
    if (!hotel) return;
    setActiveImageIndex((prev) => (prev === 0 ? hotel.images.length - 1 : prev - 1));
  };

  // Calculate number of nights and total price
  const nights = differenceInCalendarDays(checkOut, checkIn);
  const totalPrice = hotel ? hotel.price * nights : 0;

  // Loading state
  if (isLoading) {
    return (
      <div className="pt-24 pb-16 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="h-96 bg-gray-200 rounded-xl animate-pulse mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-12 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2" />
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              </div>
            </div>
            <div className="h-80 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="pt-24 pb-16 min-h-screen">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-serif font-bold mb-4">Hotel Not Found</h1>
          <p className="mb-8">Sorry, we couldn't find the hotel you were looking for.</p>
          <Button onClick={() => navigate('/hotels')}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Hotels
          </Button>
        </div>
      </div>
    );
  }

  // Ensure hotel.images is not empty before trying to access elements
  const mainImageSrc = hotel.images && hotel.images.length > 0 ? hotel.images[activeImageIndex] : '/placeholder.svg'; // Fallback image
  const thumbnailImages = hotel.images || [];


  return (
    <AnimatedTransition>
      <div className="pt-24 pb-16 min-h-screen bg-gray-50">
        <div className="container mx-auto px-4">
          {/* Image Gallery */}
          <div className="relative mb-8 rounded-xl overflow-hidden shadow-lg h-[500px]">
            <img
              src={mainImageSrc}
              alt={hotel.name}
              className="w-full h-full object-cover"
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            
            <div className="absolute bottom-8 left-8 text-white">
              <h1 className="font-serif text-4xl font-bold mb-2">{hotel.name}</h1>
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={16} />
                <span>{hotel.location}</span>
              </div>
              <div className="flex items-center">
                <div className="flex text-gold-500 mr-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      size={18} 
                      fill={star <= Math.floor(hotel.rating) ? 'currentColor' : 'none'} 
                    />
                  ))}
                </div>
                <span>{hotel.rating} rating</span>
              </div>
            </div>
            
            {/* Image navigation */}
            <button 
              onClick={prevImage} 
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 rounded-full p-2 hover:bg-white transition-colors"
            >
              <ChevronLeft />
            </button>
            <button 
              onClick={nextImage} 
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 rounded-full p-2 hover:bg-white transition-colors"
            >
              <ChevronRight />
            </button>
            
            {/* Thumbnails */}
            <div className="absolute bottom-8 right-8 flex gap-2">
              {thumbnailImages.map((img, index) => (
                <button
                  key={img || index} // Use img as key if available, fallback to index
                  onClick={() => setActiveImageIndex(index)}
                  className={cn(
                    "h-16 w-16 rounded overflow-hidden border-2 transition-all",
                    activeImageIndex === index ? "border-white" : "border-transparent opacity-80"
                  )}
                >
                  <img src={img} alt={`${hotel.name} - ${index + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Hotel Details */}
            <div className="lg:col-span-2 space-y-8">
              <section>
                <h2 className="font-serif text-2xl font-semibold mb-4">About this hotel</h2>
                <p className="text-gray-700 leading-relaxed mb-6">{hotel.description}</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {hotel.amenities.map((amenity) => (
                    <div key={amenity} className="flex items-center gap-2">
                      <Check size={16} className="text-hotel-600" />
                      <span className="text-gray-700">{amenity}</span>
                    </div>
                  ))}
                </div>
              </section>

              <Separator />
              
              <section>
                <h2 className="font-serif text-2xl font-semibold mb-4">Location</h2>
                <div className="bg-gray-200 rounded-lg h-72 mb-4 overflow-hidden">
                  {/* In a real app, this would be a map component */}
                  <div className="flex items-center justify-center h-full bg-hotel-100 text-hotel-600">
                    <MapPin className="mr-2" />
                    <span className="font-medium">{hotel.location}</span>
                  </div>
                </div>
                <p className="text-gray-700">
                  Located in the heart of {hotel.location}, our hotel offers easy access to 
                  local attractions, dining, and entertainment. The airport is just 30 minutes away,
                  and public transportation is readily available nearby.
                </p>
              </section>

              <Separator />
              
              <section>
                <h2 className="font-serif text-2xl font-semibold mb-4">Rooms & Suites</h2>
                <div className="space-y-6">
                  <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/3">
                        <img 
                          src={thumbnailImages[1] || mainImageSrc} 
                          alt="Deluxe Room" 
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="p-6 md:w-2/3">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-serif text-xl font-medium">Deluxe Room</h3>
                          <div className="text-xl font-semibold text-hotel-800">
                            ₹{hotel.price}<span className="text-gray-500 text-sm">/night</span>
                          </div>
                        </div>
                        <p className="text-gray-600 mb-4">
                          Spacious room with all essential amenities for a comfortable stay. 
                          Features a king-sized bed and modern bathroom.
                        </p>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Check size={14} className="text-hotel-600" />
                            <span>King-sized bed</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Check size={14} className="text-hotel-600" />
                            <span>Free WiFi</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Check size={14} className="text-hotel-600" />
                            <span>Room service</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Check size={14} className="text-hotel-600" />
                            <span>Air conditioning</span>
                          </div>
                        </div>
                        <Button>Select Room</Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/3">
                        <img 
                          src={thumbnailImages[2] || mainImageSrc} 
                          alt="Executive Suite" 
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="p-6 md:w-2/3">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-serif text-xl font-medium">Executive Suite</h3>
                          <div className="text-xl font-semibold text-hotel-800">
                            ₹{Math.round(hotel.price * 1.5)}<span className="text-gray-500 text-sm">/night</span>
                          </div>
                        </div>
                        <p className="text-gray-600 mb-4">
                          Luxurious suite offering separate living area and premium amenities.
                          Perfect for those seeking extra space and comfort.
                        </p>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Check size={14} className="text-hotel-600" />
                            <span>King-sized bed</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Check size={14} className="text-hotel-600" />
                            <span>Free WiFi</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Check size={14} className="text-hotel-600" />
                            <span>Living room</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Check size={14} className="text-hotel-600" />
                            <span>Premium amenities</span>
                          </div>
                        </div>
                        <Button>Select Room</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Booking Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-lg p-6 h-fit sticky top-24"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <span className="text-2xl font-semibold text-hotel-800">₹{hotel.price}</span>
                  <span className="text-gray-500"> / night</span>
                </div>
                <div className="flex items-center text-gold-500">
                  <Star size={16} fill="currentColor" />
                  <span className="ml-1 text-gray-700">{hotel.rating} rating</span>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm text-gray-600">Check in</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !checkIn && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {checkIn ? format(checkIn, "MMM dd, yyyy") : <span>Select date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white">
                        <Calendar
                          mode="single"
                          selected={checkIn}
                          onSelect={(date) => {
                            if (date) {
                              setCheckIn(date);
                              // If checkout date is before the new check-in date, adjust it
                              if (checkOut < date) {
                                setCheckOut(addDays(date, 1));
                              }
                            }
                          }}
                          initialFocus
                          disabled={(date) => date < new Date()}
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm text-gray-600">Check out</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !checkOut && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {checkOut ? format(checkOut, "MMM dd, yyyy") : <span>Select date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white">
                        <Calendar
                          mode="single"
                          selected={checkOut}
                          onSelect={(date) => date && setCheckOut(date)}
                          initialFocus
                          disabled={(date) => date <= checkIn}
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm text-gray-600">Guests</label>
                  <Select value={guests} onValueChange={setGuests}>
                    <SelectTrigger className="w-full">
                      <div className="flex items-center gap-2">
                        <Users size={16} />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {num === 1 ? 'Guest' : 'Guests'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-700">₹{hotel.price} x {nights} nights</span>
                  <span className="font-medium">₹{hotel.price * nights}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Cleaning fee</span>
                  <span className="font-medium">₹50</span> 
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Service fee</span>
                  <span className="font-medium">₹30</span>
                </div>
              </div>

              <Separator className="mb-6" />

              <div className="flex justify-between font-semibold mb-6">
                <span>Total</span>
                <span>₹{totalPrice + 50 + 30}</span>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                onClick={handleBooking} 
                // Button text/action changes if payment form is shown
              >
                Proceed to Payment 
              </Button>
              
              {/* Payment Form */}
              {showPaymentForm && (
                <div className="mt-6 border-t pt-6 space-y-4">
                  <h3 className="text-xl font-semibold mb-2">Payment Details</h3>
                  <div>
                    <label htmlFor="cardHolderName" className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
                    <Input id="cardHolderName" type="text" value={cardHolderName} onChange={(e) => setCardHolderName(e.target.value)} placeholder="John Doe" />
                  </div>
                  <div>
                    <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                    <Input id="cardNumber" type="text" value={cardNumber} onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0,16))} placeholder="0000 0000 0000 0000" maxLength={16}/>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 mb-1">Expiry Date (MM/YY)</label>
                      <Input id="expiryDate" type="text" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value.replace(/[^0-9/]/g, '').slice(0,5))} placeholder="MM/YY" />
                    </div>
                    <div className="flex-1">
                      <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                      <Input id="cvv" type="password" value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0,3))} placeholder="123" maxLength={3} />
                    </div>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      // Basic validation
                      if (!cardHolderName || cardNumber.length !== 16 || !/^\d{2}\/\d{2}$/.test(expiryDate) || cvv.length !== 3) {
                        toast({ title: "Invalid Payment Details", description: "Please check your card information.", variant: "destructive"});
                        return;
                      }
                      // Further expiry date validation (e.g. not in past) could be added here
                      handlePaymentSubmit({
                        card_number: cardNumber,
                        expiry: expiryDate,
                        cvv: cvv,
                        cardholder: cardHolderName,
                      });
                    }}
                    disabled={isBooking}
                  >
                    {isBooking ? 'Processing...' : 'Confirm Booking & Pay'}
                  </Button>
                  <Button variant="outline" className="w-full mt-2" onClick={() => setShowPaymentForm(false)}>Cancel Payment</Button>
                </div>
              )}
              
              {!showPaymentForm && (
                <p className="text-center text-xs text-gray-500 mt-4">
                  You won't be charged yet
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </AnimatedTransition>
  );
};

export default HotelDetail;
