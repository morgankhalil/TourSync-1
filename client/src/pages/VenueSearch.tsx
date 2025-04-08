import { useState, useEffect } from "react";
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
import { MapPin, Users, Music, Calendar, Loader2, Search } from "lucide-react";
import { Venue, useVenuesNearLocation } from "@/hooks/useVenues";

const VenueSearch = () => {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [radius, setRadius] = useState(25);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [searchLocation, setSearchLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  
  // Venue proximity search query
  const { 
    data: nearbyVenues, 
    isLoading: isLoadingVenues,
    error: venuesError,
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
        }
      );
    } else {
      alert("Geolocation is not supported by your browser");
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

  // Get user location on component mount
  useEffect(() => {
    getUserLocation();
  }, []);

  // Search for venues whenever the search location or radius changes
  useEffect(() => {
    if (searchLocation) {
      refetchVenues();
    }
  }, [searchLocation, radius, refetchVenues]);

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold">Find Venues Near You</h1>
          <p className="text-muted-foreground">
            Discover music venues near a specific location and find artists that are on tour in that area.
          </p>
        </div>

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
            {isLoadingVenues ? (
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

        {venuesError && (
          <div className="p-4 bg-destructive/20 text-destructive rounded-md mb-4">
            Error loading venues: {(venuesError as Error).message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nearbyVenues && nearbyVenues.map((venue: Venue) => (
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
                  
                  {venue.contactEmail && (
                    <div className="flex items-center col-span-2 truncate">
                      <span className="text-xs text-muted-foreground truncate">
                        Contact: {venue.contactEmail}
                      </span>
                    </div>
                  )}
                </div>
                
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
                  Find Artists Nearby
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VenueSearch;