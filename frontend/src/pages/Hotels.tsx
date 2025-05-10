import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Hotel, searchHotels } from '@/lib/api';
import HotelCard from '@/components/hotels/HotelCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AnimatedTransition from '@/components/ui/AnimatedTransition';
import { Filter, Search, MapPin, SlidersHorizontal, X, ChevronDownIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'react-router-dom';

const Hotels = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('location') || '');
  // API-side filters
  const [apiMinPrice, setApiMinPrice] = useState<number>(Number(searchParams.get('min_price')) || 0);
  const [apiMaxPrice, setApiMaxPrice] = useState<number>(Number(searchParams.get('max_price')) || 0);
  const [apiRating, setApiRating] = useState<string>(searchParams.get('rating_filter') || ''); // e.g. "7" for 3.5+
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>(
    (searchParams.get('property_types') || '').split(',').filter(Boolean)
  );
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    (searchParams.get('amenities') || '').split(',').filter(Boolean)
  );
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    (searchParams.get('brands') || '').split(',').filter(Boolean)
  );
  const [selectedHotelClasses, setSelectedHotelClasses] = useState<string[]>(
    (searchParams.get('hotel_class') || '').split(',').filter(Boolean)
  );
  const [freeCancellation, setFreeCancellation] = useState<boolean>(searchParams.get('free_cancellation') === 'true');
  const [specialOffers, setSpecialOffers] = useState<boolean>(searchParams.get('special_offers') === 'true');
  const [ecoCertified, setEcoCertified] = useState<boolean>(searchParams.get('eco_certified') === 'true');
  const [vacationRentals, setVacationRentals] = useState<boolean>(searchParams.get('vacation_rentals') === 'true');
  const [bedrooms, setBedrooms] = useState<number>(Number(searchParams.get('bedrooms')) || 0);
  const [bathrooms, setBathrooms] = useState<number>(Number(searchParams.get('bathrooms')) || 0);
  
  // Client-side price range filter (can be removed if API price filter is preferred)
  const [clientPriceRange, setClientPriceRange] = useState([0, 1000]); 
  
  const [sortOption, setSortOption] = useState(searchParams.get('sort_by_ui') || 'price-low'); // UI sort option: 'relevance', 'price-low', 'price-high', 'rating', 'most-reviewed'
  const [isParamsReadyForFetch, setIsParamsReadyForFetch] = useState(false); // New state
  const [filterCount, setFilterCount] = useState(0);

  // Interface for filter states to be used with overrides
  interface FilterStates {
    searchQuery: string;
    apiMinPrice: number;
    apiMaxPrice: number;
    apiRating: string;
    selectedPropertyTypes: string[];
    selectedAmenities: string[];
    sortOption: string;
    vacationRentals: boolean;
    bedrooms: number;
    bathrooms: number;
    selectedBrands: string[];
    selectedHotelClasses: string[];
    freeCancellation: boolean;
    specialOffers: boolean;
    ecoCertified: boolean;
  }
  const { toast } = useToast();

  // Effect 1: Validate search params and set defaults if necessary.
  // Signals readiness to fetch via `setIsParamsReadyForFetch`.
  useEffect(() => {
    const locParam = searchParams.get('location');
    const ciParam = searchParams.get('checkIn');
    const coParam = searchParams.get('checkOut');
    const sortParam = searchParams.get('sort_by_ui');

    const locIsMissing = !locParam || locParam.trim() === "";
    const ciIsMissing = !ciParam || ciParam.trim() === "";
    const coIsMissing = !coParam || coParam.trim() === "";
    const sortIsMissing = !sortParam; // Assuming sort is also essential for a default view

    if (locIsMissing || ciIsMissing || coIsMissing || sortIsMissing) {
      setIsParamsReadyForFetch(false); // Not ready if defaults are being set
      const newDefaults = new URLSearchParams(searchParams.toString());
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const formatDate = (date: Date) => date.toISOString().split('T')[0];

      if (locIsMissing) newDefaults.set('location', 'faridabad');
      if (ciIsMissing) newDefaults.set('checkIn', formatDate(today));
      if (coIsMissing) newDefaults.set('checkOut', formatDate(tomorrow));
      if (sortIsMissing) newDefaults.set('sort_by_ui', 'price-low');
      
      // Only update URL if it actually changes to prevent loops
      if (newDefaults.toString() !== searchParams.toString()) {
        setSearchParams(newDefaults, { replace: true });
      }
      // Return here; the effect will re-run when searchParams changes.
      // On the next run, params should be valid, and isParamsReadyForFetch will be set to true.
      return;
    }

    // If all essential params are valid, update UI states and signal readiness to fetch
    setSearchQuery(locParam || ''); // locParam is guaranteed non-empty here
    setApiMinPrice(Number(searchParams.get('min_price')) || 0);
    setApiMaxPrice(Number(searchParams.get('max_price')) || 0);
    setApiRating(searchParams.get('rating_filter') || '');
    setSelectedPropertyTypes((searchParams.get('property_types') || '').split(',').filter(Boolean));
    setSelectedAmenities((searchParams.get('amenities') || '').split(',').filter(Boolean));
    setSelectedBrands((searchParams.get('brands') || '').split(',').filter(Boolean));
    setSelectedHotelClasses((searchParams.get('hotel_class') || '').split(',').filter(Boolean));
    setFreeCancellation(searchParams.get('free_cancellation') === 'true');
    setSpecialOffers(searchParams.get('special_offers') === 'true');
    setEcoCertified(searchParams.get('eco_certified') === 'true');
    setVacationRentals(searchParams.get('vacation_rentals') === 'true');
    setBedrooms(Number(searchParams.get('bedrooms')) || 0);
    setBathrooms(Number(searchParams.get('bathrooms')) || 0);
    setSortOption(sortParam || 'price-low'); // sortParam is guaranteed non-empty

    setIsParamsReadyForFetch(true);

  }, [searchParams, setSearchParams]);


  // Effect 2: Perform the actual data fetch when params are ready.
  useEffect(() => {
    if (!isParamsReadyForFetch) {
      // If not ready, and not already loading (e.g. from a previous failed attempt or initial state),
      // ensure we show some loading state or clear hotels.
      // If params are being defaulted, isLoading might be true from initial state.
      // setHotels([]); // Optionally clear hotels if params are not ready
      return;
    }

    const doFetch = async () => {
      setIsLoading(true);

      const mapUiSortToApi = (uiSort: string): string | undefined => {
        if (uiSort === 'price-low') return '3';
        if (uiSort === 'rating') return '8';
        if (uiSort === 'most-reviewed') return '13';
        return undefined;
      };
      
      // Construct apiParams using the now-validated searchParams
      const apiCallParams: any = {
        destination: searchParams.get('location'), // Guaranteed by Effect 1
        check_in_date: searchParams.get('checkIn'),   // Guaranteed by Effect 1
        check_out_date: searchParams.get('checkOut'), // Guaranteed by Effect 1
        adults: searchParams.get('guests') ? Number(searchParams.get('guests')) : undefined,
        sort_by: mapUiSortToApi(searchParams.get('sort_by_ui') || 'price-low'), // Guaranteed by Effect 1
      };

      if (Number(searchParams.get('min_price')) > 0) apiCallParams.min_price = Number(searchParams.get('min_price'));
      if (Number(searchParams.get('max_price')) > 0) apiCallParams.max_price = Number(searchParams.get('max_price'));
      if (searchParams.get('rating_filter')) apiCallParams.rating = searchParams.get('rating_filter');
      if (searchParams.get('property_types')) apiCallParams.property_types = searchParams.get('property_types');
      if (searchParams.get('amenities')) apiCallParams.amenities = searchParams.get('amenities');
      
      const currentVacationRentals = searchParams.get('vacation_rentals') === 'true';
      if (currentVacationRentals) {
        apiCallParams.vacation_rentals = true;
        if (Number(searchParams.get('bedrooms')) > 0) apiCallParams.bedrooms = Number(searchParams.get('bedrooms'));
        if (Number(searchParams.get('bathrooms')) > 0) apiCallParams.bathrooms = Number(searchParams.get('bathrooms'));
      } else {
        if (searchParams.get('brands')) apiCallParams.brands = searchParams.get('brands');
        if (searchParams.get('hotel_class')) apiCallParams.hotel_class = searchParams.get('hotel_class');
        if (searchParams.get('free_cancellation') === 'true') apiCallParams.free_cancellation = true;
        if (searchParams.get('special_offers') === 'true') apiCallParams.special_offers = true;
        if (searchParams.get('eco_certified') === 'true') apiCallParams.eco_certified = true;
      }

      try {
        const result = await searchHotels(apiCallParams);
        setHotels(result);
      } catch (error) {
        console.error('Error fetching hotels:', error);
        setHotels([]); // Clear hotels on error
        toast({
          variant: 'destructive',
          title: 'Error Fetching Hotels',
          description: (error as Error).message || 'Failed to load hotels. Please try refreshing or adjust your search.',
        });
      } finally {
        setIsLoading(false);
        setIsParamsReadyForFetch(false); // Reset readiness to prevent re-fetch on unrelated re-renders
      }
    };

    doFetch();
  }, [isParamsReadyForFetch, searchParams, toast]); // Include all dependencies for doFetch

  // Effect 3: Calculate filter count (can remain separate or be merged if appropriate)
  useEffect(() => {
    let count = 0;
    if (apiMinPrice > 0 || apiMaxPrice > 0) count++; 
    if (apiRating) count++;
    if (selectedPropertyTypes.length > 0) count++;
    if (selectedAmenities.length > 0) count++;
    if (vacationRentals) {
      count++; 
      if (bedrooms > 0) count++;
      if (bathrooms > 0) count++;
    } else { 
      if (selectedBrands.length > 0) count++;
      if (selectedHotelClasses.length > 0) count++;
      if (freeCancellation) count++;
      if (specialOffers) count++;
      if (ecoCertified) count++;
    }
    setFilterCount(count);
  }, [apiMinPrice, apiMaxPrice, apiRating, selectedPropertyTypes, selectedAmenities, selectedBrands, selectedHotelClasses, freeCancellation, specialOffers, ecoCertified, vacationRentals, bedrooms, bathrooms]);
  
  const handleSearchSubmit = (e?: React.FormEvent, overrides?: Partial<FilterStates>) => {
    if (e) e.preventDefault();

    const currentStates: FilterStates = {
      searchQuery,
      apiMinPrice,
      apiMaxPrice,
      apiRating,
      selectedPropertyTypes,
      selectedAmenities,
      sortOption,
      vacationRentals,
      bedrooms,
      bathrooms,
      selectedBrands,
      selectedHotelClasses,
      freeCancellation,
      specialOffers,
      ecoCertified,
    };

    const effectiveStates = { ...currentStates, ...overrides };
    
    const newSearchParams = new URLSearchParams(searchParams.toString());
    
    if (effectiveStates.searchQuery) newSearchParams.set('location', effectiveStates.searchQuery);
    else newSearchParams.delete('location');

    newSearchParams.set('min_price', effectiveStates.apiMinPrice.toString());
    newSearchParams.set('max_price', effectiveStates.apiMaxPrice.toString());
    newSearchParams.set('rating_filter', effectiveStates.apiRating);
    newSearchParams.set('property_types', effectiveStates.selectedPropertyTypes.join(','));
    newSearchParams.set('amenities', effectiveStates.selectedAmenities.join(','));
    newSearchParams.set('sort_by_ui', effectiveStates.sortOption);

    if (effectiveStates.vacationRentals) {
      newSearchParams.set('vacation_rentals', 'true');
      newSearchParams.set('bedrooms', effectiveStates.bedrooms.toString());
      newSearchParams.set('bathrooms', effectiveStates.bathrooms.toString());
      newSearchParams.delete('brands');
      newSearchParams.delete('hotel_class');
      newSearchParams.delete('free_cancellation');
      newSearchParams.delete('special_offers');
      newSearchParams.delete('eco_certified');
    } else {
      newSearchParams.delete('vacation_rentals');
      newSearchParams.delete('bedrooms');
      newSearchParams.delete('bathrooms');
      newSearchParams.set('brands', effectiveStates.selectedBrands.join(','));
      newSearchParams.set('hotel_class', effectiveStates.selectedHotelClasses.join(','));
      if (effectiveStates.freeCancellation) newSearchParams.set('free_cancellation', 'true'); else newSearchParams.delete('free_cancellation');
      if (effectiveStates.specialOffers) newSearchParams.set('special_offers', 'true'); else newSearchParams.delete('special_offers');
      if (effectiveStates.ecoCertified) newSearchParams.set('eco_certified', 'true'); else newSearchParams.delete('eco_certified');
    }
    setSearchParams(newSearchParams);
  };
  
  const filteredHotels = hotels.filter(hotel => {
    if (clientPriceRange[0] > 0 && hotel.price < clientPriceRange[0]) return false;
    if (clientPriceRange[1] < 1000 && hotel.price > clientPriceRange[1]) return false; 
    return true;
  });
  
  const sortedHotels = [...filteredHotels].sort((a, b) => {
    if (sortOption === 'price-high') return b.price - a.price;
    if (sortOption === 'price-low') return a.price - b.price;
    if (sortOption === 'rating') return b.rating - a.rating;
    return (b.rating * 0.6) - (a.rating * 0.6) + (a.price * 0.4) - (b.price * 0.4);
  });
  
  const resetFilters = () => {
    setApiMinPrice(0);
    setApiMaxPrice(0);
    setApiRating('');
    setSelectedPropertyTypes([]);
    setSelectedAmenities([]);
    setSelectedBrands([]);
    setSelectedHotelClasses([]);
    setFreeCancellation(false);
    setSpecialOffers(false);
    setEcoCertified(false);
    setVacationRentals(false);
    setBedrooms(0);
    setBathrooms(0);
    setClientPriceRange([0, 1000]);

    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.set('min_price', '0');
    newSearchParams.set('max_price', '0');
    newSearchParams.set('rating_filter', '');
    newSearchParams.set('property_types', '');
    newSearchParams.set('amenities', '');
    newSearchParams.set('brands', '');
    newSearchParams.set('hotel_class', '');
    newSearchParams.delete('free_cancellation');
    newSearchParams.delete('special_offers');
    newSearchParams.delete('eco_certified');
    newSearchParams.delete('vacation_rentals');
    newSearchParams.set('bedrooms', '0');
    newSearchParams.set('bathrooms', '0');
    setSearchParams(newSearchParams);
  };
  
  return (
    <AnimatedTransition>
      <div className="pt-24 pb-16 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="font-serif text-3xl md:text-4xl font-semibold mb-4">Find Your Perfect Stay</h1>
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input 
                  placeholder="Search hotels or locations" 
                  className="pl-10" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit" className="gap-2">
                <Search size={16} />
                Search
              </Button>
              <div className="flex gap-2">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button type="button" variant="outline" className="gap-2"> {/* Added type="button" */}
                      <Filter size={16} />
                      Filters {filterCount > 0 && <span className="ml-1 text-xs bg-hotel-600 text-white rounded-full w-5 h-5 flex items-center justify-center">{filterCount}</span>}
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Filter Hotels</SheetTitle>
                      <SheetDescription>
                        Refine your search results. Filters apply when Search is clicked.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="py-6 space-y-8">
                      <div>
                        <h3 className="font-medium mb-2">Price Range (API)</h3>
                        <div className="flex gap-2">
                          <Input type="number" placeholder="Min price" value={apiMinPrice || ''} onChange={(e) => setApiMinPrice(Number(e.target.value))} />
                          <Input type="number" placeholder="Max price" value={apiMaxPrice || ''} onChange={(e) => setApiMaxPrice(Number(e.target.value))} />
                        </div>
                      </div>
                      {/* Minimum Rating Select temporarily removed for debugging
                      <div>
                        <h3 className="font-medium mb-2">Minimum Rating (API)</h3>
                        <Select value={apiRating} onValueChange={setApiRating}>
                          <SelectTrigger><SelectValue placeholder="Any Rating" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Any Rating</SelectItem>
                            <SelectItem value="7">3.5+ Stars</SelectItem>
                            <SelectItem value="8">4.0+ Stars</SelectItem>
                            <SelectItem value="9">4.5+ Stars</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      */}
                      {/* Property Types DropdownMenu temporarily removed for debugging
                      <div>
                        <h3 className="font-medium mb-2">Property Types (API)</h3>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-between">
                              Select Property Types ({selectedPropertyTypes.length > 0 ? selectedPropertyTypes.length : 'Any'}) <ChevronDownIcon className="ml-2 h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-full">
                            <DropdownMenuLabel>Property Types</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {[{ label: "Hotel", value: "17" }, { label: "Vacation Rental", value: "12" }, { label: "Apartment", value: "18" }].map((pt) => (
                              <DropdownMenuCheckboxItem key={pt.value} checked={selectedPropertyTypes.includes(pt.value)} onCheckedChange={(checked) => setSelectedPropertyTypes((prev) => checked ? [...prev, pt.value] : prev.filter((item) => item !== pt.value))}>{pt.label}</DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      */}
                      {/* Amenities DropdownMenu temporarily removed for debugging
                      <div>
                        <h3 className="font-medium mb-2">Amenities (API)</h3>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-between">
                              Select Amenities ({selectedAmenities.length > 0 ? selectedAmenities.length : 'Any'}) <ChevronDownIcon className="ml-2 h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-full">
                            <DropdownMenuLabel>Amenities</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {[{ label: "Free Wi-Fi", value: "35" }, { label: "Pool", value: "9" }, { label: "Free Breakfast", value: "19" }].map((am) => (
                              <DropdownMenuCheckboxItem key={am.value} checked={selectedAmenities.includes(am.value)} onCheckedChange={(checked) => setSelectedAmenities((prev) => checked ? [...prev, am.value] : prev.filter((item) => item !== am.value))}>{am.label}</DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      */}
                      {/* Search Mode and VR inputs temporarily removed for debugging
                      <div>
                        <h3 className="font-medium mb-2">Search Mode</h3>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="vacationRentals" checked={vacationRentals} onCheckedChange={(checked) => setVacationRentals(checked as boolean)} />
                          <label htmlFor="vacationRentals" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Search Vacation Rentals</label>
                        </div>
                      </div>
                      {vacationRentals && (
                        <>
                          <div>
                            <h3 className="font-medium mb-2">Bedrooms (VR)</h3>
                            <Input type="number" placeholder="Min bedrooms" value={bedrooms || ''} onChange={(e) => setBedrooms(Number(e.target.value))} min="0"/>
                          </div>
                          <div>
                            <h3 className="font-medium mb-2">Bathrooms (VR)</h3>
                            <Input type="number" placeholder="Min bathrooms" value={bathrooms || ''} onChange={(e) => setBathrooms(Number(e.target.value))} min="0"/>
                          </div>
                        </>
                      )}
                      */}
                      {!vacationRentals && ( 
                        <>
                          {/* Brands DropdownMenu temporarily removed for debugging
                          <div>
                            <h3 className="font-medium mb-2">Brands (Hotels)</h3>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full justify-between" disabled={vacationRentals}>
                                  Select Brands ({selectedBrands.length > 0 ? selectedBrands.length : 'Any'}) <ChevronDownIcon className="ml-2 h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-full">
                                <DropdownMenuLabel>Brands</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {[{ label: "Accor", value: "33" }, { label: "Banyan Tree", value: "67" }].map((brand) => (
                                  <DropdownMenuCheckboxItem key={brand.value} checked={selectedBrands.includes(brand.value)} onCheckedChange={(checked) => setSelectedBrands((prev) => checked ? [...prev, brand.value] : prev.filter((item) => item !== brand.value))} disabled={vacationRentals}>{brand.label}</DropdownMenuCheckboxItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          */}
                          {/* Hotel Class DropdownMenu temporarily removed for debugging
                          <div>
                            <h3 className="font-medium mb-2">Hotel Class (Hotels)</h3>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="w-full justify-between" disabled={vacationRentals}>
                                  Select Hotel Classes ({selectedHotelClasses.length > 0 ? selectedHotelClasses.length : 'Any'}) <ChevronDownIcon className="ml-2 h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-full">
                                <DropdownMenuLabel>Hotel Class</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {[{ label: "2-star", value: "2" }, { label: "3-star", value: "3" }, { label: "4-star", value: "4" }, { label: "5-star", value: "5" }].map((hc) => (
                                  <DropdownMenuCheckboxItem key={hc.value} checked={selectedHotelClasses.includes(hc.value)} onCheckedChange={(checked) => setSelectedHotelClasses((prev) => checked ? [...prev, hc.value] : prev.filter((item) => item !== hc.value))} disabled={vacationRentals}>{hc.label}</DropdownMenuCheckboxItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          */}
                          {/* <div className="space-y-2">
                            <h3 className="font-medium mb-2">Other Options (Hotels)</h3>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="freeCancellation" checked={freeCancellation} onCheckedChange={(checked) => setFreeCancellation(checked as boolean)} disabled={vacationRentals} />
                              <label htmlFor="freeCancellation" className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed ${vacationRentals ? 'opacity-50' : ''}`}>Free Cancellation</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="specialOffers" checked={specialOffers} onCheckedChange={(checked) => setSpecialOffers(checked as boolean)} disabled={vacationRentals} />
                              <label htmlFor="specialOffers" className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed ${vacationRentals ? 'opacity-50' : ''}`}>Special Offers</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox id="ecoCertified" checked={ecoCertified} onCheckedChange={(checked) => setEcoCertified(checked as boolean)} disabled={vacationRentals} />
                              <label htmlFor="ecoCertified" className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed ${vacationRentals ? 'opacity-50' : ''}`}>Eco Certified</label>
                            </div>
                          </div> */}
                        </>
                      )}
                      {/* Slider component temporarily removed for debugging
                      <div> 
                        <div className="flex justify-between mb-2">
                          <h3 className="font-medium">Price Range (Client-side)</h3>
                          <span className="text-gray-500">${clientPriceRange[0]} - ${clientPriceRange[1]}</span>
                        </div>
                        <Slider defaultValue={[0, 1000]} max={1000} step={50} value={clientPriceRange} onValueChange={(value) => setClientPriceRange(value as number[])} className="my-6" />
                      </div>
                      */}
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="outline" onClick={resetFilters}>Reset API Filters</Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
                <Select value={sortOption} onValueChange={(value) => { setSortOption(value); handleSearchSubmit(undefined, { sortOption: value }); }} >
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="Sort by" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low (Client)</SelectItem>
                    <SelectItem value="rating">Highest Rating</SelectItem>
                    <SelectItem value="most-reviewed">Most Reviewed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </form>
          </div>
          
          {filterCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {(apiMinPrice > 0 || apiMaxPrice > 0) && (
                 <Button variant="outline" size="sm" className="rounded-full" onClick={() => {setApiMinPrice(0); setApiMaxPrice(0); handleSearchSubmit(undefined, { apiMinPrice: 0, apiMaxPrice: 0 });}}>
                   Price: {apiMinPrice > 0 ? `₹${apiMinPrice}` : '*'} - {apiMaxPrice > 0 ? `₹${apiMaxPrice}` : '*'} <X size={14} className="ml-1" />
                 </Button>
              )}
              {apiRating && (
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => {setApiRating(''); handleSearchSubmit(undefined, { apiRating: '' });}}>
                  Rating: { { '7': '3.5+', '8': '4.0+', '9': '4.5+' }[apiRating] || 'Any' } Stars <X size={14} className="ml-1" />
                </Button>
              )}
              {selectedPropertyTypes.length > 0 && (
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => {setSelectedPropertyTypes([]); handleSearchSubmit(undefined, { selectedPropertyTypes: [] });}}>
                  Types: {selectedPropertyTypes.map(pt => ({'17': 'Hotel', '12': 'Vacation Rental', '18': 'Apt'}[pt] || pt)).join(', ')} <X size={14} className="ml-1" />
                </Button>
              )}
              {selectedAmenities.length > 0 && (
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => {setSelectedAmenities([]); handleSearchSubmit(undefined, { selectedAmenities: [] });}}>
                  Amenities: {selectedAmenities.map(am => ({'35': 'WiFi', '9': 'Pool', '19': 'Breakfast'}[am] || am)).join(', ')} <X size={14} className="ml-1" />
                </Button>
              )}
              {!vacationRentals && selectedBrands.length > 0 && (
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => {setSelectedBrands([]); handleSearchSubmit(undefined, { selectedBrands: [] });}}>
                  Brands: {selectedBrands.map(b => ({'33': 'Accor', '67': 'Banyan Tree'}[b] || b)).join(', ')} <X size={14} className="ml-1" />
                </Button>
              )}
              {!vacationRentals && selectedHotelClasses.length > 0 && (
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => {setSelectedHotelClasses([]); handleSearchSubmit(undefined, { selectedHotelClasses: [] });}}>
                  Class: {selectedHotelClasses.map(hc => `${hc}-star`).join(', ')} <X size={14} className="ml-1" />
                </Button>
              )}
              {!vacationRentals && freeCancellation && (
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => {setFreeCancellation(false); handleSearchSubmit(undefined, { freeCancellation: false });}}>
                  Free Cancellation <X size={14} className="ml-1" />
                </Button>
              )}
              {!vacationRentals && specialOffers && (
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => {setSpecialOffers(false); handleSearchSubmit(undefined, { specialOffers: false });}}>
                  Special Offers <X size={14} className="ml-1" />
                </Button>
              )}
              {!vacationRentals && ecoCertified && (
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => {setEcoCertified(false); handleSearchSubmit(undefined, { ecoCertified: false });}}>
                  Eco Certified <X size={14} className="ml-1" />
                </Button>
              )}
              {vacationRentals && (
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => {setVacationRentals(false); setBedrooms(0); setBathrooms(0); handleSearchSubmit(undefined, { vacationRentals: false });}}>
                  Mode: Vacation Rentals
                  {bedrooms > 0 && `, Beds: ${bedrooms}+`}
                  {bathrooms > 0 && `, Baths: ${bathrooms}+`}
                  <X size={14} className="ml-1" />
                </Button>
              )}
              {filterCount > 1 && (
                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-hotel-600" onClick={resetFilters}>
                  Clear all API filters
                </Button>
              )}
            </div>
          )}
          
          <div className="mb-10">
            <p className="mb-6 text-gray-600">{sortedHotels.length} hotels found</p>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
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
                ))}
              </div>
            ) : sortedHotels.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sortedHotels.map((hotel, index) => (
                  <HotelCard key={hotel.id} hotel={hotel} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto" >
                  <SlidersHorizontal className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No hotels found</h3>
                  <p className="text-gray-600 mb-6"> Try adjusting your search or filters to find hotels. </p>
                  <Button onClick={resetFilters}>Clear all filters</Button>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AnimatedTransition>
  );
};

export default Hotels;
