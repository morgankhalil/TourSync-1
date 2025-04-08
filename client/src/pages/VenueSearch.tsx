import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { 
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { 
  MapPin, 
  Users, 
  Music, 
  Calendar, 
  Loader2, 
  Search, 
  Filter,
  Tag, 
  List,
  Building,
  Map as MapIcon,
  X
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { Venue, useVenues, useVenuesNearLocation } from "@/hooks/useVenues";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Badge } from "@/components/ui/badge";
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetDescription,
  SheetFooter 
} from "@/components/ui/sheet";

const VenueSearch = () => {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [radius, setRadius] = useState(25);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [searchLocation, setSearchLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filteredVenues, setFilteredVenues] = useState<Venue[] | null>(null);
  const [venueFilters, setVenueFilters] = useState({
    city: "",
    minCapacity: 0,
    maxCapacity: 5000,
    dealType: "",
    genre: ""
  });
  
  const { toast } = useToast();
  const { venueData: activeVenue } = useActiveVenue();

  // Google Maps API loading
  const { isLoaded: isMapLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyD0-KVQsJUMXK-hL4aPcQt7_YBuX7FJVUs' // Public key from Google tutorial examples
  });
  
  // All venues query
  const { 
    data: allVenues = [], 
    isLoading: isLoadingAllVenues, 
    error: allVenuesError 
  } = useVenues();
  
  // Venue proximity search query
  const { 
    data: nearbyVenues, 
    isLoading: isLoadingNearbyVenues,
    error: nearbyVenuesError,
    refetch: refetchVenues
  } = useVenuesNearLocation({
    latitude: searchLocation?.latitude || 0,
    longitude: searchLocation?.longitude || 0,
    radius: radius,
    limit: 100
  });

  // Combined venues for display
  const venues = useMemo(() => {
    return filteredVenues || nearbyVenues || allVenues || [];
  }, [filteredVenues, nearbyVenues, allVenues]);

  // Get user's current location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          setSearchLocation({ latitude, longitude });
          setIsGettingLocation(false);
          
          // Center map on user location
          if (mapRef) {
            mapRef.panTo({ lat: latitude, lng: longitude });
            mapRef.setZoom(10);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsGettingLocation(false);
          toast({
            title: "Location Error",
            description: "Could not get your current location. Please try searching for a city instead.",
            variant: "destructive",
          });
          
          // Default to Chicago if we can't get the user's location
          const defaultLocation = { latitude: 41.8781, longitude: -87.6298 };
          setSearchLocation(defaultLocation);
          
          // Center map on default location
          if (mapRef) {
            mapRef.panTo({ lat: defaultLocation.latitude, lng: defaultLocation.longitude });
            mapRef.setZoom(10);
          }
        },
        { 
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      toast({
        title: "Browser Limitation",
        description: "Geolocation is not supported by your browser. Please try searching for a city instead.",
        variant: "destructive",
      });
      
      // Default to Chicago if geolocation is not supported
      const defaultLocation = { latitude: 41.8781, longitude: -87.6298 };
      setSearchLocation(defaultLocation);
      
      // Center map on default location
      if (mapRef) {
        mapRef.panTo({ lat: defaultLocation.latitude, lng: defaultLocation.longitude });
        mapRef.setZoom(10);
      }
    }
  };

  // Search for location using a search API (simplified version)
  const searchForLocation = async () => {
    if (!searchQuery) return;
    
    let newLocation;
    
    // For demo purposes, we'll use Chicago's coordinates if the search has "Chicago" in it
    if (searchQuery.toLowerCase().includes("chicago")) {
      newLocation = { latitude: 41.8781, longitude: -87.6298 };
    } 
    // New York
    else if (searchQuery.toLowerCase().includes("new york") || searchQuery.toLowerCase().includes("nyc")) {
      newLocation = { latitude: 40.7128, longitude: -74.0060 };
    }
    // Los Angeles
    else if (searchQuery.toLowerCase().includes("los angeles") || searchQuery.toLowerCase().includes("la")) {
      newLocation = { latitude: 34.0522, longitude: -118.2437 };
    }
    // Austin
    else if (searchQuery.toLowerCase().includes("austin")) {
      newLocation = { latitude: 30.2672, longitude: -97.7431 };
    }
    // Nashville
    else if (searchQuery.toLowerCase().includes("nashville")) {
      newLocation = { latitude: 36.1627, longitude: -86.7816 };
    }
    else {
      // Fallback to Chicago for demo
      newLocation = { latitude: 41.8781, longitude: -87.6298 };
    }
    
    setSearchLocation(newLocation);
    
    // Center map on search location
    if (mapRef) {
      mapRef.panTo({ lat: newLocation.latitude, lng: newLocation.longitude });
      mapRef.setZoom(10);
    }
  };

  // Set active venue location if available
  const useActiveVenueLocation = () => {
    if (activeVenue && activeVenue.latitude && activeVenue.longitude) {
      const latitude = parseFloat(activeVenue.latitude);
      const longitude = parseFloat(activeVenue.longitude);
      
      if (!isNaN(latitude) && !isNaN(longitude)) {
        const newLocation = { latitude, longitude };
        setSearchLocation(newLocation);
        
        // Center map on venue location
        if (mapRef) {
          mapRef.panTo({ lat: latitude, lng: longitude });
          mapRef.setZoom(12);
        }
        
        toast({
          title: "Using venue location",
          description: `Searching around ${activeVenue.name} in ${activeVenue.city}, ${activeVenue.state}`,
        });
        return true;
      }
    }
    return false;
  };
  
  // Don't automatically try to get location on component mount
  // This prevents location errors from showing on page load
  useEffect(() => {
    // Try to use active venue location first, or default to Chicago
    if (!useActiveVenueLocation()) {
      const defaultLocation = { latitude: 41.8781, longitude: -87.6298 };
      setSearchLocation(defaultLocation);
    }
  }, [activeVenue]);

  // Search for venues whenever the search location or radius changes
  useEffect(() => {
    if (searchLocation) {
      refetchVenues();
    }
  }, [searchLocation, radius, refetchVenues]);

  // Error handling with toast notification
  useEffect(() => {
    if (allVenuesError) {
      toast({
        title: "Error fetching venues",
        description: "There was a problem loading the venues. Please try again.",
        variant: "destructive",
      });
    }
  }, [allVenuesError, toast]);
  
  // Handle map load
  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMapRef(map);
    
    // If we already have a search location, center the map there
    if (searchLocation) {
      map.panTo({ lat: searchLocation.latitude, lng: searchLocation.longitude });
      map.setZoom(10);
    }
  }, [searchLocation]);
  
  // Apply filters to venues
  const applyFilters = useCallback(() => {
    const { city, minCapacity, maxCapacity, dealType, genre } = venueFilters;
    
    // Start with all venues (if nearbyVenues is null) or nearby venues
    const venueList = nearbyVenues || allVenues || [];
    
    const filtered = venueList.filter(venue => {
      // Filter by city
      if (city && !venue.city.toLowerCase().includes(city.toLowerCase())) {
        return false;
      }
      
      // Filter by capacity range
      if (venue.capacity) {
        if (venue.capacity < minCapacity || venue.capacity > maxCapacity) {
          return false;
        }
      }
      
      // Filter by deal type
      if (dealType && venue.dealType !== dealType) {
        return false;
      }
      
      // Filter by genre
      if (genre && venue.genre && !venue.genre.toLowerCase().includes(genre.toLowerCase())) {
        return false;
      }
      
      return true;
    });
    
    setFilteredVenues(filtered);
    setFilterOpen(false);
  }, [venueFilters, nearbyVenues, allVenues]);

  // Renders a single venue card
  const renderVenueCard = (venue: Venue) => (
    <Card 
      key={venue.id} 
      className="overflow-hidden hover:shadow-lg transition-shadow duration-300 border-primary/10"
    >
      <CardHeader className="pb-2 bg-primary/5">
        <CardTitle className="text-xl">{venue.name}</CardTitle>
        <CardDescription className="flex items-center text-sm">
          <MapPin size={14} className="mr-1" />
          {venue.city}, {venue.state}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-4">
        <p className="text-sm mb-4">{venue.address}</p>
        <div className="grid grid-cols-2 gap-4 text-sm mb-2">
          <div className="flex items-center">
            <Users size={16} className="mr-1 text-primary" />
            <span>Capacity: {venue.capacity || 'N/A'}</span>
          </div>
          
          {venue.dealType && (
            <div className="flex items-center">
              <Tag size={16} className="mr-1 text-primary" />
              <span>Deal: {venue.dealType}</span>
            </div>
          )}
          
          {venue.contactEmail && (
            <div className="flex items-center col-span-2 truncate">
              <span className="text-xs text-muted-foreground truncate">
                Contact: {venue.contactName || venue.contactEmail}
              </span>
            </div>
          )}
        </div>
        
        {venue.genre && (
          <div className="flex items-center mt-2">
            <Music size={14} className="mr-1 text-primary" />
            <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs">
              {venue.genre}
            </span>
          </div>
        )}
        
        {venue.description && (
          <div className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {venue.description}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-2 flex justify-between items-center bg-muted/10">
        <Button 
          variant="outline" 
          size="sm"
          className="w-full"
          onClick={() => setLocation(`/venues/${venue.id}`)}
        >
          <MapPin size={16} className="mr-2" />
          View Details
        </Button>
        
        <Button 
          variant="default" 
          size="sm"
          className="w-full ml-2"
          onClick={() => setLocation(`/venues/${venue.id}/artists-nearby`)}
        >
          <Calendar size={16} className="mr-2" />
          Find Artists
        </Button>
      </CardFooter>
    </Card>
  );

  // Clear filters
  const clearFilters = useCallback(() => {
    setVenueFilters({
      city: "",
      minCapacity: 0,
      maxCapacity: 5000,
      dealType: "",
      genre: ""
    });
    setFilteredVenues(null);
  }, []);
  
  // Get unique cities and deal types for filter dropdowns
  const uniqueCities = useMemo(() => {
    const cities = new Set<string>();
    venues.forEach(venue => {
      if (venue.city) cities.add(venue.city);
    });
    return Array.from(cities).sort();
  }, [venues]);
  
  const uniqueDealTypes = useMemo(() => {
    const dealTypes = new Set<string>();
    venues.forEach(venue => {
      if (venue.dealType) dealTypes.add(venue.dealType);
    });
    return Array.from(dealTypes).sort();
  }, [venues]);
  
  // Map center coordinates
  const mapCenter = useMemo(() => {
    return searchLocation ? 
      { lat: searchLocation.latitude, lng: searchLocation.longitude } : 
      { lat: 41.8781, lng: -87.6298 }; // Chicago default
  }, [searchLocation]);
  
  // Handle marker click
  const handleMarkerClick = useCallback((venue: Venue) => {
    setSelectedVenue(venue);
  }, []);
  
  return (
    <div className="w-full h-screen overflow-hidden flex flex-col">
      <div className="flex-none p-4 border-b">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Venues</h1>
            <p className="text-muted-foreground">
              Browse venues or search for venues near a specific location to find touring opportunities
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={getUserLocation} disabled={isGettingLocation} variant="outline" size="sm">
              {isGettingLocation ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <MapPin className="h-4 w-4 mr-2" />
              )}
              My Location
            </Button>
            
            {activeVenue && (
              <Button variant="outline" size="sm" onClick={useActiveVenueLocation}>
                <Building className="h-4 w-4 mr-2" />
                {activeVenue.name}
              </Button>
            )}
            
            <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filter Venues</SheetTitle>
                  <SheetDescription>
                    Apply filters to find specific venues
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="filter-city">City</Label>
                    <select
                      id="filter-city"
                      className="w-full p-2 border rounded"
                      value={venueFilters.city}
                      onChange={(e) => setVenueFilters({...venueFilters, city: e.target.value})}
                    >
                      <option value="">All Cities</option>
                      {uniqueCities.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="filter-capacity">Capacity Range</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="filter-min-capacity"
                        type="number"
                        placeholder="Min"
                        value={venueFilters.minCapacity}
                        onChange={(e) => setVenueFilters({
                          ...venueFilters, 
                          minCapacity: parseInt(e.target.value) || 0
                        })}
                        className="w-1/2"
                      />
                      <span>to</span>
                      <Input
                        id="filter-max-capacity"
                        type="number"
                        placeholder="Max"
                        value={venueFilters.maxCapacity}
                        onChange={(e) => setVenueFilters({
                          ...venueFilters, 
                          maxCapacity: parseInt(e.target.value) || 5000
                        })}
                        className="w-1/2"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="filter-deal-type">Deal Type</Label>
                    <select
                      id="filter-deal-type"
                      className="w-full p-2 border rounded"
                      value={venueFilters.dealType}
                      onChange={(e) => setVenueFilters({...venueFilters, dealType: e.target.value})}
                    >
                      <option value="">Any Deal Type</option>
                      {uniqueDealTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="filter-genre">Genre</Label>
                    <Input
                      id="filter-genre"
                      placeholder="e.g. Rock, Jazz, Hip-Hop"
                      value={venueFilters.genre}
                      onChange={(e) => setVenueFilters({...venueFilters, genre: e.target.value})}
                    />
                  </div>
                </div>
                <SheetFooter>
                  <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
                  <Button onClick={applyFilters}>Apply Filters</Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex space-x-2 col-span-2">
            <Input 
              placeholder="Enter a location (e.g., Chicago, New York)" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={searchForLocation}
              disabled={isGettingLocation}
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Label htmlFor="radius-slider" className="whitespace-nowrap">
              Radius: {radius} mi
            </Label>
            <Slider
              id="radius-slider"
              min={5}
              max={100}
              step={5}
              value={[radius]}
              onValueChange={(values) => setRadius(values[0])}
              className="flex-1"
            />
          </div>
        </div>
        
        {searchLocation && (
          <div className="text-sm text-muted-foreground mt-2">
            Searching around: {searchLocation.latitude.toFixed(4)}, {searchLocation.longitude.toFixed(4)}
            {userLocation === searchLocation && " (Your location)"}
            {activeVenue && 
             parseFloat(activeVenue.latitude) === searchLocation.latitude && 
             parseFloat(activeVenue.longitude) === searchLocation.longitude && 
             ` (${activeVenue.name} location)`}
            {filteredVenues && ` • Showing ${filteredVenues.length} of ${nearbyVenues?.length || 0} venues`}
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
        {/* Venue List */}
        <div className="md:col-span-1 overflow-y-auto p-4 border-r">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              {isLoadingNearbyVenues ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </div>
              ) : venues && venues.length > 0 ? (
                `${venues.length} Venues`
              ) : (
                "No venues found"
              )}
            </h2>
            
            {filteredVenues && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" /> Clear Filters
              </Button>
            )}
          </div>
          
          {nearbyVenuesError && (
            <div className="p-4 bg-destructive/20 text-destructive rounded-md mb-4">
              Error: {(nearbyVenuesError as Error).message}
            </div>
          )}
          
          <div className="space-y-4">
            {venues.map((venue: Venue) => (
              <Card 
                key={venue.id} 
                className={`overflow-hidden hover:shadow transition-shadow duration-300 cursor-pointer ${selectedVenue?.id === venue.id ? 'border-primary' : 'border-primary/10'}`}
                onClick={() => handleMarkerClick(venue)}
              >
                <CardContent className="p-4">
                  <div className="font-semibold text-lg mb-1">{venue.name}</div>
                  <div className="flex items-center text-sm mb-2">
                    <MapPin size={14} className="mr-1 text-muted-foreground" />
                    <span className="text-muted-foreground">{venue.city}, {venue.state}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {venue.capacity && (
                      <Badge variant="outline" className="text-xs">
                        <Users size={12} className="mr-1" />
                        {venue.capacity}
                      </Badge>
                    )}
                    
                    {venue.dealType && (
                      <Badge variant="outline" className="text-xs">
                        <Tag size={12} className="mr-1" />
                        {venue.dealType}
                      </Badge>
                    )}
                    
                    {venue.genre && (
                      <Badge variant="outline" className="text-xs">
                        <Music size={12} className="mr-1" />
                        {venue.genre}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        {/* Map */}
        <div className="md:col-span-2 lg:col-span-3 relative">
          {isMapLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={mapCenter}
              zoom={10}
              onLoad={onMapLoad}
              options={{
                maxZoom: 18,
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: true
              }}
            >
              {venues.map(venue => (
                <Marker
                  key={venue.id}
                  position={{
                    lat: parseFloat(venue.latitude),
                    lng: parseFloat(venue.longitude)
                  }}
                  onClick={() => handleMarkerClick(venue)}
                  animation={selectedVenue?.id === venue.id ? google.maps.Animation.BOUNCE : undefined}
                />
              ))}
              
              {selectedVenue && (
                <InfoWindow
                  position={{
                    lat: parseFloat(selectedVenue.latitude),
                    lng: parseFloat(selectedVenue.longitude)
                  }}
                  onCloseClick={() => setSelectedVenue(null)}
                >
                  <div className="p-2">
                    <h3 className="font-bold">{selectedVenue.name}</h3>
                    <p className="text-sm">{selectedVenue.address}</p>
                    <p className="text-sm">{selectedVenue.city}, {selectedVenue.state}</p>
                    {selectedVenue.capacity && (
                      <p className="text-sm">Capacity: {selectedVenue.capacity}</p>
                    )}
                    <div className="mt-2">
                      <button 
                        onClick={() => setLocation(`/venues/${selectedVenue.id}`)}
                        className="text-sm px-2 py-1 bg-primary text-white rounded"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted/10">
              <Spinner />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VenueSearch;