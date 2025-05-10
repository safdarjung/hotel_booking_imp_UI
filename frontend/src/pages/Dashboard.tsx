
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Booking, getUserBookings } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, ChevronRight, Clock, MapPin } from 'lucide-react';
import { format, parseISO, isAfter } from 'date-fns';
import { Link, Navigate } from 'react-router-dom';
import AnimatedTransition from '@/components/ui/AnimatedTransition';

const Dashboard = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const fetchBookings = async () => {
        try {
          const data = await getUserBookings(user.id);
          setBookings(data);
        } catch (error) {
          console.error('Error fetching bookings:', error);
        } finally {
          setIsLoadingBookings(false);
        }
      };

      fetchBookings();
    } else if (!isLoading && !isAuthenticated) {
      setIsLoadingBookings(false);
    }
  }, [user, isAuthenticated, isLoading]);

  // Redirect if not authenticated
  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Separate upcoming and past bookings
  const now = new Date();
  const upcomingBookings = bookings.filter(booking => isAfter(parseISO(booking.checkIn), now));
  const pastBookings = bookings.filter(booking => !isAfter(parseISO(booking.checkIn), now));

  return (
    <AnimatedTransition>
      <div className="pt-24 pb-16 min-h-screen bg-gray-50">
        <div className="container mx-auto px-4">
          <header className="mb-10">
            <h1 className="font-serif text-3xl font-bold mb-2">My Bookings</h1>
            <p className="text-gray-600">View and manage your reservations</p>
          </header>

          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="mb-8">
              <TabsTrigger value="upcoming" className="text-base">
                Upcoming
              </TabsTrigger>
              <TabsTrigger value="past" className="text-base">
                Past Bookings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="animate-fade-in">
              {isLoadingBookings ? (
                <div className="space-y-6">
                  {[1, 2].map(i => (
                    <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-full md:w-1/4 h-48 bg-gray-200 rounded-lg" />
                        <div className="w-full md:w-3/4 space-y-4">
                          <div className="h-8 bg-gray-200 rounded w-3/4" />
                          <div className="h-4 bg-gray-200 rounded w-1/2" />
                          <div className="h-4 bg-gray-200 rounded w-1/4" />
                          <div className="h-4 bg-gray-200 rounded w-2/3" />
                          <div className="h-10 bg-gray-200 rounded w-40" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : upcomingBookings.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                  <h3 className="text-xl font-medium mb-2">No upcoming bookings</h3>
                  <p className="text-gray-500 mb-6">
                    You don't have any upcoming reservations at the moment
                  </p>
                  <Link to="/hotels">
                    <Button>
                      Find a Hotel
                    </Button>
                  </Link>
                </div>
              ) : (
                <motion.div 
                  className="space-y-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {upcomingBookings.map((booking, index) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-lg shadow-sm overflow-hidden"
                    >
                      <div className="flex flex-col md:flex-row">
                        <div className="w-full md:w-1/4">
                          <img 
                            src={booking.image} 
                            alt={booking.hotelName} 
                            className="h-48 md:h-full w-full object-cover"
                          />
                        </div>
                        <div className="p-6 w-full md:w-3/4">
                          <div className="flex flex-col md:flex-row justify-between">
                            <div>
                              <h3 className="font-serif text-xl font-semibold mb-2">
                                {booking.hotelName}
                              </h3>
                              <div className="flex items-center text-gray-600 mb-4">
                                <MapPin size={16} className="mr-1" />
                                <span>{booking.location}</span>
                              </div>
                            </div>
                            <div className="md:text-right mt-4 md:mt-0">
                              <div className="font-medium text-lg text-hotel-800">
                                ${booking.totalPrice}
                              </div>
                              <div className="text-sm text-gray-500">
                                Total for {booking.guests} guests
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-4 mb-6">
                            <div className="flex items-center text-gray-700">
                              <Calendar size={16} className="mr-2 text-hotel-600" />
                              <span>
                                {format(parseISO(booking.checkIn), 'MMM d')} - {format(parseISO(booking.checkOut), 'MMM d, yyyy')}
                              </span>
                            </div>
                            <div className="flex items-center text-gray-700">
                              <Clock size={16} className="mr-2 text-hotel-600" />
                              <span>Check-in: After 3:00 PM</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-3">
                            <Link to={`/hotel/${booking.hotelId}`}>
                              <Button variant="outline" className="flex items-center gap-1">
                                View Hotel
                                <ChevronRight size={16} />
                              </Button>
                            </Link>
                            <Button variant="secondary">Modify Booking</Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </TabsContent>

            <TabsContent value="past" className="animate-fade-in">
              {isLoadingBookings ? (
                <div className="space-y-6">
                  {[1, 2].map(i => (
                    <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-full md:w-1/4 h-48 bg-gray-200 rounded-lg" />
                        <div className="w-full md:w-3/4 space-y-4">
                          <div className="h-8 bg-gray-200 rounded w-3/4" />
                          <div className="h-4 bg-gray-200 rounded w-1/2" />
                          <div className="h-4 bg-gray-200 rounded w-1/4" />
                          <div className="h-4 bg-gray-200 rounded w-2/3" />
                          <div className="h-10 bg-gray-200 rounded w-40" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : pastBookings.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                  <h3 className="text-xl font-medium mb-2">No past bookings</h3>
                  <p className="text-gray-500">You haven't completed any stays yet</p>
                </div>
              ) : (
                <motion.div 
                  className="space-y-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {pastBookings.map((booking, index) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-lg shadow-sm overflow-hidden"
                    >
                      <div className="flex flex-col md:flex-row">
                        <div className="w-full md:w-1/4">
                          <img 
                            src={booking.image} 
                            alt={booking.hotelName} 
                            className="h-48 md:h-full w-full object-cover opacity-90"
                          />
                        </div>
                        <div className="p-6 w-full md:w-3/4">
                          <div className="flex flex-col md:flex-row justify-between">
                            <div>
                              <h3 className="font-serif text-xl font-semibold mb-2">
                                {booking.hotelName}
                              </h3>
                              <div className="flex items-center text-gray-600 mb-4">
                                <MapPin size={16} className="mr-1" />
                                <span>{booking.location}</span>
                              </div>
                            </div>
                            <div className="md:text-right mt-4 md:mt-0">
                              <div className="font-medium text-lg text-hotel-800">
                                ${booking.totalPrice}
                              </div>
                              <div className="text-sm text-gray-500">
                                Total for {booking.guests} guests
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-4 mb-6">
                            <div className="flex items-center text-gray-700">
                              <Calendar size={16} className="mr-2 text-hotel-600" />
                              <span>
                                {format(parseISO(booking.checkIn), 'MMM d')} - {format(parseISO(booking.checkOut), 'MMM d, yyyy')}
                              </span>
                            </div>
                            <div className="flex items-center text-gray-700">
                              <span className="py-1 px-2 bg-gray-100 rounded text-sm">Completed</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-3">
                            <Link to={`/hotel/${booking.hotelId}`}>
                              <Button variant="outline" className="flex items-center gap-1">
                                View Hotel
                                <ChevronRight size={16} />
                              </Button>
                            </Link>
                            <Button variant="secondary">Leave a Review</Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AnimatedTransition>
  );
};

export default Dashboard;
