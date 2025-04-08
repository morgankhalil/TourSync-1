import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
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
  Grid, 
  Tag, 
  List 
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { Venue, useVenues, useVenuesNearLocation } from "@/hooks/useVenues";

const VenueSearch = () => {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [radius, setRadius] = useState(25);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [searchLocation, setSearchLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const { toast } = useToast();
  
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
    limit: 50
  });

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
          setSearchLocation({ latitude: 41.8781, longitude: -87.6298 });
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
      setSearchLocation({ latitude: 41.8781, longitude: -87.6298 });
    }
  };

  // Search for location using a search API (simplified version)
  const searchForLocation = async () => {
    if (!searchQuery) return;
    
    // For demo purposes, we'll use Chicago's coordinates if the search has "Chicago" in it
    if (searchQuery.toLowerCase().includes("chicago")) {
      setSearchLocation({ latitude: 41.8781, longitude: -87.6298 });
    } 
    // New York
    else if (searchQuery.toLowerCase().includes("new york") || searchQuery.toLowerCase().includes("nyc")) {
      setSearchLocation({ latitude: 40.7128, longitude: -74.0060 });
    }
    // Los Angeles
    else if (searchQuery.toLowerCase().includes("los angeles") || searchQuery.toLowerCase().includes("la")) {
      setSearchLocation({ latitude: 34.0522, longitude: -118.2437 });
    }
    // Austin
    else if (searchQuery.toLowerCase().includes("austin")) {
      setSearchLocation({ latitude: 30.2672, longitude: -97.7431 });
    }
    // Nashville
    else if (searchQuery.toLowerCase().includes("nashville")) {
      setSearchLocation({ latitude: 36.1627, longitude: -86.7816 });
    }
    else {
      // Fallback to Chicago for demo
      setSearchLocation({ latitude: 41.8781, longitude: -87.6298 });
    }
  };

  // Don't automatically try to get location on component mount
  // This prevents location errors from showing on page load
  useEffect(() => {
    // Instead of automatically getting location, default to Chicago
    setSearchLocation({ latitude: 41.8781, longitude: -87.6298 });
  }, []);

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

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold">Venues</h1>
          <p className="text-muted-foreground">
            Browse venues or search for venues near a specific location to find touring opportunities.
          </p>
        </div>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="list" className="flex items-center">
              <List className="h-4 w-4 mr-2" />
              All Venues
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center">
              <Search className="h-4 w-4 mr-2" />
              Find Venues Near You
            </TabsTrigger>
          </TabsList>
          
          {/* All Venues Tab */}
          <TabsContent value="list" className="mt-0">
            {isLoadingAllVenues ? (
              <div className="h-60 w-full flex items-center justify-center">
                <Spinner />
              </div>
            ) : allVenues && allVenues.length === 0 ? (
              <div className="text-center p-12 bg-muted/20 rounded-lg">
                <p className="text-lg text-muted-foreground">No venues found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allVenues && allVenues.map((venue: Venue) => renderVenueCard(venue))}
              </div>
            )}
          </TabsContent>
          
          {/* Venue Search Tab */}
          <TabsContent value="search" className="mt-0">
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-4">
                    <div className="flex space-x-2">
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
                    <Button 
                      variant="outline" 
                      onClick={getUserLocation}
                      disabled={isGettingLocation}
                      className="w-full"
                    >
                      {isGettingLocation ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Getting your location...
                        </>
                      ) : (
                        <>
                          <MapPin className="h-4 w-4 mr-2" />
                          Use my current location
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="radius-slider">
                      Search radius: {radius} miles
                    </Label>
                    <Slider
                      id="radius-slider"
                      min={5}
                      max={100}
                      step={5}
                      value={[radius]}
                      onValueChange={(values) => setRadius(values[0])}
                    />
                  </div>
                </div>

                {searchLocation && (
                  <div className="text-sm text-muted-foreground">
                    Searching around: {searchLocation.latitude.toFixed(4)}, {searchLocation.longitude.toFixed(4)}
                    {userLocation === searchLocation && " (Your location)"}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="mb-2">
              <h2 className="text-xl font-semibold mb-4">
                {isLoadingNearbyVenues ? (
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Searching for venues...
                  </div>
                ) : nearbyVenues && nearbyVenues.length > 0 ? (
                  `Found ${nearbyVenues.length} venues within ${radius} miles`
                ) : (
                  "No venues found in this area"
                )}
              </h2>
            </div>

            {nearbyVenuesError && (
              <div className="p-4 bg-destructive/20 text-destructive rounded-md mb-4">
                Error loading venues: {(nearbyVenuesError as Error).message}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nearbyVenues && nearbyVenues.map((venue: Venue) => renderVenueCard(venue))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default VenueSearch;