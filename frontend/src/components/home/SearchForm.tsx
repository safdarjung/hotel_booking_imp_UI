
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Search, Users, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';

const popularLocations = [
  { value: "maldives", label: "Maldives" },
  { value: "switzerland", label: "Switzerland" },
  { value: "bali", label: "Bali" },
  { value: "new york", label: "New York" },
  { value: "venice", label: "Venice" },
  { value: "cancun", label: "Cancun" },
];

const SearchForm = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const [checkIn, setCheckIn] = useState<Date>();
  const [checkOut, setCheckOut] = useState<Date>();
  const [guests, setGuests] = useState("2");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    // Build search params
    const params = new URLSearchParams();
    if (location) params.append('location', location);
    if (checkIn) params.append('checkIn', format(checkIn, 'yyyy-MM-dd'));
    if (checkOut) params.append('checkOut', format(checkOut, 'yyyy-MM-dd'));
    if (guests) params.append('guests', guests);

    navigate(`/hotels?${params.toString()}`);
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocation(e.target.value);
    setShowSuggestions(e.target.value.length > 0);
  };

  const selectSuggestion = (suggestion: string) => {
    setLocation(suggestion);
    setShowSuggestions(false);
  };

  // Filter locations based on input
  const filteredLocations = popularLocations.filter(loc => 
    loc.label.toLowerCase().includes(location.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-white rounded-lg shadow-lg p-6"
    >
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2 relative">
            <label className="text-sm font-medium text-gray-700">Location</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <MapPin size={16} />
              </div>
              <Input 
                value={location}
                onChange={handleLocationChange}
                placeholder="Where are you going?" 
                className="pl-10"
              />
            </div>
            
            {/* Location suggestions dropdown */}
            {showSuggestions && filteredLocations.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
                <ul className="py-1 max-h-60 overflow-auto">
                  {filteredLocations.map((loc) => (
                    <li 
                      key={loc.value}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-700"
                      onClick={() => selectSuggestion(loc.label)}
                    >
                      {loc.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Check in</label>
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
                  {checkIn ? format(checkIn, "PPP") : <span>Select date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white">
                <Calendar
                  mode="single"
                  selected={checkIn}
                  onSelect={setCheckIn}
                  initialFocus
                  disabled={(date) => date < new Date()}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Check out</label>
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
                  {checkOut ? format(checkOut, "PPP") : <span>Select date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white">
                <Calendar
                  mode="single"
                  selected={checkOut}
                  onSelect={setCheckOut}
                  initialFocus
                  disabled={(date) => date < (checkIn || new Date())}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Guests</label>
            <Select value={guests} onValueChange={setGuests}>
              <SelectTrigger className="w-full">
                <div className="flex items-center">
                  <Users className="mr-2 h-4 w-4" />
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

        {isAdvancedOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 mt-4"
          >
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Price Range</label>
              <div className="flex gap-4 items-center">
                <Input type="number" placeholder="Min" className="w-full" />
                <span className="text-gray-400">-</span>
                <Input type="number" placeholder="Max" className="w-full" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Rating</label>
              <Select>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Any Rating" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="any">Any Rating</SelectItem>
                  <SelectItem value="4+">4+ Stars</SelectItem>
                  <SelectItem value="3+">3+ Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Property Type</label>
              <Select>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="any">All Types</SelectItem>
                  <SelectItem value="hotel">Hotel</SelectItem>
                  <SelectItem value="resort">Resort</SelectItem>
                  <SelectItem value="villa">Villa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <button
            type="button"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className="text-sm text-hotel-600 hover:text-hotel-800 transition-colors"
          >
            {isAdvancedOpen ? 'Hide advanced options' : 'Show advanced options'}
          </button>

          <Button type="submit" className="w-full md:w-auto gap-2" size="lg">
            <Search size={18} />
            Search Hotels
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default SearchForm;
