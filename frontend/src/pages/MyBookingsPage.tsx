import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getUserBookings, Booking } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const MyBookingsPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }

    const fetchBookings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const userBookings = await getUserBookings(user.id);
        setBookings(userBookings);
      } catch (err) {
        setError('Failed to fetch bookings. Please try again.');
        console.error('Error fetching bookings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [isAuthenticated, user, navigate]);

  if (isLoading) {
    return (
      <div className="container mx-auto pt-24 pb-16 min-h-screen flex justify-center items-center">
        <p>Loading bookings...</p> {/* Replace with a proper spinner/skeleton later */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto pt-24 pb-16 min-h-screen">
        <h1 className="text-3xl font-semibold mb-6">My Bookings</h1>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto pt-24 pb-16 min-h-screen">
      <h1 className="text-3xl font-semibold mb-6">My Bookings</h1>
      {bookings.length === 0 ? (
        <p>You have no bookings yet.</p>
      ) : (
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hotel</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Room Type</TableHead>
                <TableHead>Total Price</TableHead>
                <TableHead>Booked On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">{booking.hotel_name}</TableCell>
                  <TableCell>{booking.city}</TableCell>
                  <TableCell>{format(new Date(booking.check_in), 'PPP')}</TableCell>
                  <TableCell>{format(new Date(booking.check_out), 'PPP')}</TableCell>
                  <TableCell>{booking.room_type}</TableCell>
                  <TableCell>₹{booking.total_price.toFixed(2)}</TableCell>
                  <TableCell>{format(new Date(booking.booking_date), 'PPP p')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default MyBookingsPage;
