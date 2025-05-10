
import { motion } from 'framer-motion';
import HeroSection from '@/components/home/HeroSection';
import SearchForm from '@/components/home/SearchForm';
import { Hotel, searchHotels } from '@/lib/api';
import { useEffect, useState } from 'react';
import HotelCard from '@/components/hotels/HotelCard';
import AnimatedTransition from '@/components/ui/AnimatedTransition';
import { ArrowRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [featuredHotels, setFeaturedHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedHotels = async () => {
      try {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const formatDate = (date: Date) => date.toISOString().split('T')[0];

        const defaultSearchParams = {
          destination: 'faridabad', // Default city for featured hotels
          check_in_date: formatDate(today),
          check_out_date: formatDate(tomorrow),
          // sort_by: 'YOUR_PREFERRED_SORT_FOR_FEATURED' // e.g. 'rating' if API supports
        };
        const hotels = await searchHotels(defaultSearchParams);
        // Ensure hotels is an array before slicing, in case API returns non-array on error/empty
        setFeaturedHotels(Array.isArray(hotels) ? hotels.slice(0, 3) : []);
      } catch (error) {
        console.error('Error fetching featured hotels:', error);
        setFeaturedHotels([]); // Set to empty array on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedHotels();
  }, []);

  return (
    <AnimatedTransition>
      <div className="flex flex-col min-h-screen">
        <HeroSection>
          <SearchForm />
        </HeroSection>

        {/* Featured Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="font-serif text-4xl font-semibold mb-4"
              >
                Featured Destinations
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-gray-600 max-w-2xl mx-auto"
              >
                Explore our handpicked selection of luxurious properties in the world's most sought-after destinations.
              </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {isLoading ? (
                // Skeleton loading
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl overflow-hidden shadow-md">
                    <div className="h-60 bg-gray-200 animate-pulse" />
                    <div className="p-6 space-y-4">
                      <div className="h-6 bg-gray-200 rounded animate-pulse" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                      <div className="flex gap-2">
                        <div className="h-6 bg-gray-200 rounded animate-pulse w-16" />
                        <div className="h-6 bg-gray-200 rounded animate-pulse w-16" />
                      </div>
                      <div className="flex justify-between">
                        <div className="h-8 bg-gray-200 rounded animate-pulse w-24" />
                        <div className="h-8 bg-gray-200 rounded animate-pulse w-24" />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                featuredHotels.map((hotel, index) => (
                  <HotelCard key={hotel.id} hotel={hotel} index={index} />
                ))
              )}
            </div>

            <div className="text-center">
              <Link to="/hotels">
                <Button variant="outline" size="lg" className="gap-2">
                  View All Hotels
                  <ArrowRight size={16} />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Experience Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="font-serif text-4xl font-semibold mb-6 leading-tight">Experience Luxury At Every Destination</h2>
                <p className="text-gray-600 mb-8">
                  Our carefully curated collection features only the finest hotels and resorts, 
                  each offering exceptional service, stunning locations, and unforgettable experiences.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex flex-col">
                    <div className="text-4xl font-semibold text-hotel-600 mb-2">250+</div>
                    <p className="text-gray-600">Luxury Hotels</p>
                  </div>
                  <div className="flex flex-col">
                    <div className="text-4xl font-semibold text-hotel-600 mb-2">100+</div>
                    <p className="text-gray-600">Destinations</p>
                  </div>
                  <div className="flex flex-col">
                    <div className="text-4xl font-semibold text-hotel-600 mb-2">10k+</div>
                    <p className="text-gray-600">Happy Guests</p>
                  </div>
                  <div className="flex flex-col">
                    <div className="text-4xl font-semibold text-hotel-600 mb-2">24/7</div>
                    <p className="text-gray-600">Customer Support</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                <div className="aspect-[4/3] rounded-xl overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1615880484746-a134be9a6ecf?q=80&w=1974" 
                    alt="Luxury Villa" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-8 -left-8 bg-white p-6 rounded-lg shadow-xl max-w-xs">
                  <div className="flex items-center mb-4">
                    <div className="flex text-gold-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} size={16} fill="currentColor" />
                      ))}
                    </div>
                    <span className="ml-2 text-gray-600 text-sm">500+ reviews</span>
                  </div>
                  <p className="font-medium">
                    "The best booking experience I've ever had. The service was exceptional from start to finish."
                  </p>
                  <div className="mt-4 text-sm text-gray-500">
                    — Sarah J., New York
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-hotel-700 text-white">
          <div className="container mx-auto px-4 text-center">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="font-serif text-4xl font-semibold mb-6"
            >
              Ready to Experience Luxury?
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-white/80 max-w-2xl mx-auto mb-8"
            >
              Create an account today and start planning your dream getaway with exclusive member benefits.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link to="/register">
                <Button size="lg" className="bg-white text-hotel-700 hover:bg-gray-100">
                  Sign Up Now
                </Button>
              </Link>
              <Link to="/hotels">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                  Browse Hotels
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      </div>
    </AnimatedTransition>
  );
};

export default Index;
