
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Hotel } from '@/lib/api';
import { Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface HotelCardProps {
  hotel: Hotel;
  index?: number;
  className?: string;
}

const HotelCard = ({ hotel, index = 0, className }: HotelCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className={cn(
        "hotel-card bg-white rounded-xl overflow-hidden shadow-md",
        className
      )}
    >
      <Link 
        to={`/hotel/${hotel.id}`} 
        state={{ serpapi_property_details_link: hotel.serpapi_property_details_link }}
        className="block"
      >
        <div className="relative h-60 overflow-hidden">
          <img
            src={hotel.images && hotel.images.length > 0 ? hotel.images[0] : '/placeholder.svg'}
            alt={hotel.name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
          />
          {hotel.rating >= 4.7 && (
            <Badge 
              variant="secondary" 
              className="absolute top-4 right-4 bg-hotel-600 text-white font-medium"
            >
              Top Rated
            </Badge>
          )}
        </div>
        
        <div className="p-6">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-serif text-xl font-semibold text-gray-800">
              {hotel.name}
            </h3>
            <div className="flex items-center text-gold-500 gap-1">
              <Star size={16} fill="currentColor" />
              <span className="font-medium">{hotel.rating}</span>
            </div>
          </div>
          
          <p className="text-gray-500 mb-4">{hotel.location}</p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {hotel.amenities.slice(0, 3).map((amenity) => (
              <Badge key={amenity} variant="outline" className="bg-gray-50">
                {amenity}
              </Badge>
            ))}
            {hotel.amenities.length > 3 && (
              <Badge variant="outline" className="bg-gray-50">
                +{hotel.amenities.length - 3} more
              </Badge>
            )}
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              {hotel.price && hotel.price > 0 ? (
                <>
                  <span className="text-2xl font-semibold text-hotel-800">₹{hotel.price}</span>
                  <span className="text-gray-500 text-sm"> / night</span>
                </>
              ) : (
                <span className="text-lg font-semibold text-gray-700">Price not available</span>
              )}
            </div>
            <span className="text-hotel-600 hover:text-hotel-800 transition-colors font-medium">
              View Details
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default HotelCard;
