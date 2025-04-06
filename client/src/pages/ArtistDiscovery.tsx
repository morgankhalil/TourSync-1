import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Calendar as CalendarIcon, Filter, Music, Users, Clock, Route as RouteIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Band, Tour, Venue, TourDate } from '@shared/schema';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { VenueCalendarSidebar } from '@/components/venue/VenueCalendarSidebar';
import { useActiveVenue } from '@/hooks/useActiveVenue';
import { Skeleton } from '@/components/ui/skeleton';
import BandDetailModal from '@/components/band/BandDetailModal';
import { calculateBandVenueMatch } from '@/utils/matchingAlgorithm';

// Interface for band with match percentage
interface BandWithMatch extends Omit<Band, 'drawSize'> {
  matchPercentage: number;
  genres: string[];
  drawSizeCategory: string;
  drawSize?: number | null;
}

// Google Maps container style
const mapContainerStyle = {
  width: '100%',
  height: '500px',
  borderRadius: '0.5rem'
};

export function ArtistDiscovery() {
  const [activeTab, setActiveTab] = useState('map-view');
  const [viewMode, setViewMode] = useState('opportunities'); // 'opportunities' or 'tours'
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [distanceFilter, setDistanceFilter] = useState([50]); // Miles
  const [genreFilters, setGenreFilters] = useState<string[]>([]);
  const [drawSizeFilter, setDrawSizeFilter] = useState<string>('');
  const [showAvailableOnly, setShowAvailableOnly] = useState(true);
  const [selectedBand, setSelectedBand] = useState<BandWithMatch | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<BandWithMatch | null>(null);
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string>("");
  const [setMapCenterManually, setSetMapCenterManually] = useState<{lat: number, lng: number} | null>(null);
  const [isBandDetailOpen, setIsBandDetailOpen] = useState(false);
  
  // Get active venue from context
  const { activeVenue, isLoading: isVenueLoading, setActiveVenue } = useActiveVenue();
  
  // Fetch venues for venue selector
  const { data: venues = [], isLoading: isLoadingVenues } = useQuery<Venue[]>({
    queryKey: ['/api/venues'],
    retry: false
  });
  
  // Set map center based on active venue or manual setting
  const mapCenter = React.useMemo(() => {
    // First priority: manually set map center (from venue selector)
    if (setMapCenterManually) {
      return setMapCenterManually;
    }
    
    // Second priority: active venue location
    if (activeVenue && activeVenue.latitude && activeVenue.longitude) {
      return {
        lat: parseFloat(activeVenue.latitude),
        lng: parseFloat(activeVenue.longitude)
      };
    }
    
    // Default to NYC if no venue selected
    return { lat: 40.7128, lng: -74.006 };
  }, [activeVenue, setMapCenterManually]);
  
  // Fetch bands
  const { data: bands = [], isLoading: isLoadingBands } = useQuery<Band[]>({
    queryKey: ['/api/bands'],
    retry: false
  });

  // Fetch all tour dates to display on the map (for tour route view)
  const { data: allTourDates, isLoading: isLoadingTourDates } = useQuery<TourDate[]>({
    queryKey: ['/api/tours/all-dates'],
  });

  // Fetch tours to associate with bands and dates
  const { data: toursList, isLoading: isLoadingTours } = useQuery<Tour[]>({
    queryKey: ['/api/tours'],
  });

  // Process bands with match percentage
  const processedBands: BandWithMatch[] = React.useMemo(() => {
    if (!bands || !activeVenue) return [];
    
    return bands.map((band: Band) => {
      // Calculate real match percentage using our algorithm
      const matchPercent = calculateBandVenueMatch(band, activeVenue);
      
      // Determine draw size category based on actual draw size
      let drawSizeCategory = 'Unknown';
      if (band.drawSize) {
        if (band.drawSize < 100) drawSizeCategory = 'Small (0-100)';
        else if (band.drawSize < 300) drawSizeCategory = 'Medium (100-300)';
        else drawSizeCategory = 'Large (300+)';
      }
      
      // Extract genres from band data
      const genreList = band.genre 
        ? band.genre.split(',').map(g => g.trim()) 
        : [];
      
      // Add match percentage and other attributes we'll use for filtering
      return {
        ...band,
        matchPercentage: matchPercent,
        genres: genreList,
        drawSizeCategory: drawSizeCategory
      };
    }).sort((a: BandWithMatch, b: BandWithMatch) => b.matchPercentage - a.matchPercentage);
  }, [bands, activeVenue]);
  
  // Filter bands based on selected filters
  const filteredBands = React.useMemo(() => {
    return processedBands.filter((band) => {
      // Filter by genre if any genres are selected
      if (genreFilters.length > 0 && !band.genres.some(genre => genreFilters.includes(genre))) {
        return false;
      }
      
      // Filter by draw size
      if (drawSizeFilter && band.drawSizeCategory !== drawSizeFilter) {
        return false;
      }
      
      // Other filters can be added here
      
      return true;
    });
  }, [processedBands, genreFilters, drawSizeFilter]);
  
  // Fetch Google Maps API key from backend
  useEffect(() => {
    axios.get('/api/config/maps-api-key')
      .then(response => {
        if (response.data && response.data.apiKey) {
          setGoogleMapsApiKey(response.data.apiKey);
        }
      })
      .catch(error => {
        console.error("Failed to fetch Google Maps API key:", error);
      });
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  const handleViewModeChange = (value: string) => {
    setViewMode(value);
  };
  
  const handleGenreFilterChange = (genre: string) => {
    setGenreFilters(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre) 
        : [...prev, genre]
    );
  };
  
  const handleDrawSizeFilterChange = (size: string) => {
    setDrawSizeFilter(prev => prev === size ? '' : size);
  };
  
  const handleBandSelect = (band: BandWithMatch) => {
    setSelectedBand(band);
    setIsBandDetailOpen(true);
  };
  
  const handleMarkerClick = (band: BandWithMatch) => {
    setSelectedMarker(band);
  };
  
  // Genres for filtering
  const genreOptions = ['Rock', 'Pop', 'Hip Hop', 'Electronic', 'Jazz', 'Indie', 'Metal', 'Country', 'Alternative'];
  
  // Draw size options
  const drawSizeOptions = ['Small (0-100)', 'Medium (100-300)', 'Large (300+)'];

  // Draw tours on map for the tour routes view
  const renderTourRoutes = () => {
    if (!window.google || !allTourDates || !toursList || !processedBands) {
      return null;
    }

    // Group tour dates by tour
    const tourDatesByTour = new Map<number, TourDate[]>();
    allTourDates.forEach(td => {
      if (!tourDatesByTour.has(td.tourId)) {
        tourDatesByTour.set(td.tourId, []);
      }
      tourDatesByTour.get(td.tourId)?.push(td);
    });
    
    // Tour colors for differentiation
    const colors = ['#4A154B', '#2EB67D', '#ECB22E', '#E01E5A', '#36C5F0'];
    
    // Mapping of cities to coordinates for the US (for demo purposes)
    const cityCoordinates: Record<string, {lat: number, lng: number}> = {
      'New York': { lat: 40.7128, lng: -74.0060 },
      'Boston': { lat: 42.3601, lng: -71.0589 },
      'Chicago': { lat: 41.8781, lng: -87.6298 },
      'Detroit': { lat: 42.3314, lng: -83.0458 },
      'Cleveland': { lat: 41.4993, lng: -81.6944 },
      'Minneapolis': { lat: 44.9778, lng: -93.2650 },
      'Columbus': { lat: 39.9612, lng: -82.9988 },
      'Nashville': { lat: 36.1627, lng: -86.7816 },
      'Austin': { lat: 30.2672, lng: -97.7431 },
      'Denver': { lat: 39.7392, lng: -104.9903 },
      'Seattle': { lat: 47.6062, lng: -122.3321 },
      'Portland': { lat: 45.5051, lng: -122.6750 },
      'San Francisco': { lat: 37.7749, lng: -122.4194 },
      'Los Angeles': { lat: 34.0522, lng: -118.2437 },
      'San Diego': { lat: 32.7157, lng: -117.1611 },
      'Phoenix': { lat: 33.4484, lng: -112.0740 },
      'Las Vegas': { lat: 36.1699, lng: -115.1398 },
      'Dallas': { lat: 32.7767, lng: -96.7970 },
      'Houston': { lat: 29.7604, lng: -95.3698 },
      'Miami': { lat: 25.7617, lng: -80.1918 },
      'Atlanta': { lat: 33.7490, lng: -84.3880 },
      'Philadelphia': { lat: 39.9526, lng: -75.1652 },
      'Washington': { lat: 38.9072, lng: -77.0369 }
    };

    // Create a mapping of bandId to band object for quick lookups
    const bandsMap = new Map<number, BandWithMatch>();
    processedBands.forEach(band => {
      bandsMap.set(band.id, band);
    });

    return (
      <div className="rounded-md overflow-hidden border">
        <LoadScript
          googleMapsApiKey={googleMapsApiKey}
        >
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={5}
          >
            {/* Venue marker */}
            {activeVenue && activeVenue.latitude && activeVenue.longitude && (
              <Marker
                position={{ lat: parseFloat(activeVenue.latitude), lng: parseFloat(activeVenue.longitude) }}
                icon={{
                  path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                  fillColor: '#1e40af',
                  fillOpacity: 1,
                  strokeWeight: 1,
                  strokeColor: '#fff',
                  scale: 1.5,
                }}
              />
            )}
            
            {/* Tour routes and band markers */}
            {toursList?.map((tour, index) => {
              const tourDates = tourDatesByTour.get(tour.id) || [];
              const validTourDates = tourDates.filter(td => td.city && td.state);
              
              if (validTourDates.length === 0) return null;
              
              const band = bandsMap.get(tour.bandId);
              if (!band) return null;
              
              // Only proceed with rendering if the band passes our filters
              if (genreFilters.length > 0 && !band.genres.some(genre => genreFilters.includes(genre))) {
                return null;
              }
              
              if (drawSizeFilter && band.drawSizeCategory !== drawSizeFilter) {
                return null;
              }
              
              // Get tour color
              const tourColor = colors[index % colors.length];
              
              // Create tour path coordinates
              const pathCoordinates: {lat: number, lng: number}[] = [];
              
              // Return the tour route and markers
              return (
                <React.Fragment key={tour.id}>
                  {validTourDates.map((td, dateIndex) => {
                    // Get coordinates for the city
                    const coords = cityCoordinates[td.city] || { 
                      lat: parseFloat(activeVenue?.latitude || "41.0") + (Math.random() - 0.5) * 10, 
                      lng: parseFloat(activeVenue?.longitude || "-87.0") + (Math.random() - 0.5) * 10 
                    };
                    
                    pathCoordinates.push(coords);
                    
                    // Status-specific border color
                    let borderColor = '#ECB22E'; // Yellow for pending
                    if (td.status === 'confirmed') {
                      borderColor = '#2EB67D'; // Green for confirmed
                    } else if (td.status === 'open') {
                      borderColor = '#E01E5A'; // Red for open dates
                    }
                    
                    // Band initials for marker
                    const initials = band.name
                      .split(' ')
                      .map(word => word[0])
                      .join('')
                      .substring(0, 2)
                      .toUpperCase();
                      
                    return (
                      <Marker
                        key={`tour-${tour.id}-date-${td.id}`}
                        position={coords}
                        title={`${band.name} - ${td.city}, ${td.state} (${new Date(td.date).toLocaleDateString()})`}
                        onClick={() => handleBandSelect(band)}
                        icon={{
                          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                            <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 42 42">
                              <!-- Main circle with tour color -->
                              <circle cx="21" cy="21" r="17" fill="${tourColor}" />
                              
                              <!-- Text for initials -->
                              <text x="21" y="26" font-family="Arial" font-size="12" font-weight="bold" text-anchor="middle" fill="white">${initials}</text>
                              
                              <!-- Status border -->
                              <circle cx="21" cy="21" r="19" fill="none" stroke="${borderColor}" stroke-width="4" />
                              
                              <!-- Pointer at bottom -->
                              <path d="M21 38 L17 44 L25 44 Z" fill="${borderColor}" />
                            </svg>
                          `)}`,
                          scaledSize: new window.google.maps.Size(42, 48),
                          anchor: new window.google.maps.Point(21, 44)
                        }}
                      />
                    );
                  })}
                  
                  {/* Draw the tour path if there are multiple points */}
                  {pathCoordinates.length >= 2 && (
                    <React.Fragment>
                      {new window.google.maps.Polyline({
                        path: pathCoordinates,
                        geodesic: true,
                        strokeColor: tourColor,
                        strokeOpacity: 1.0,
                        strokeWeight: 3,
                        // We would need to use a reference to the Google Map instance here instead of 'map'
                      })}
                    </React.Fragment>
                  )}
                </React.Fragment>
              );
            })}
          </GoogleMap>
        </LoadScript>
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Calendar Sidebar */}
      <div className="w-full md:w-1/4 border-r">
        <VenueCalendarSidebar 
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          venue={activeVenue}
        />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Artist Discovery</h1>
            <p className="text-muted-foreground">
              Find the perfect bands for {activeVenue?.name || 'your venue'} based on your calendar and preferences
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Select value={activeVenue?.id?.toString() || ''} onValueChange={(value) => {
              const venue = venues?.find((v: Venue) => v.id.toString() === value);
              if (venue) {
                setActiveVenue(venue);
                if (venue.latitude && venue.longitude) {
                  setSetMapCenterManually({
                    lat: parseFloat(venue.latitude),
                    lng: parseFloat(venue.longitude)
                  });
                }
              }
            }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select venue" />
              </SelectTrigger>
              <SelectContent>
                {venues?.map((venue: Venue) => (
                  <SelectItem key={venue.id} value={venue.id.toString()}>
                    {venue.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* View Mode Tabs */}
        <Tabs defaultValue="opportunities" value={viewMode} onValueChange={handleViewModeChange} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="opportunities">Booking Opportunities</TabsTrigger>
            <TabsTrigger value="tours">Tour Routes</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Content based on view mode */}
        <TabsContent value="opportunities" className="mt-0">
          {/* Filter Cards - Only show in opportunities view */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <MapPin className="mr-2 h-4 w-4" />
                  Distance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Slider 
                      value={distanceFilter} 
                      min={10} 
                      max={500} 
                      step={10} 
                      onValueChange={setDistanceFilter} 
                    />
                    <div className="flex justify-between mt-2">
                      <span className="text-sm text-muted-foreground">10 miles</span>
                      <span className="text-sm font-medium">{distanceFilter[0]} miles</span>
                      <span className="text-sm text-muted-foreground">500 miles</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Music className="mr-2 h-4 w-4" />
                  Genre
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {genreOptions.slice(0, 6).map(genre => (
                    <div key={genre} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`genre-${genre}`}
                        checked={genreFilters.includes(genre)}
                        onCheckedChange={() => handleGenreFilterChange(genre)}
                      />
                      <Label htmlFor={`genre-${genre}`}>{genre}</Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Users className="mr-2 h-4 w-4" />
                  Draw Size
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {drawSizeOptions.map(size => (
                    <Button 
                      key={size}
                      variant={drawSizeFilter === size ? "default" : "outline"}
                      className="mr-2"
                      onClick={() => handleDrawSizeFilterChange(size)}
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Availability Switch - Only in opportunities view */}
          <div className="mb-6 flex items-center space-x-2">
            <Switch
              id="available-only"
              checked={showAvailableOnly}
              onCheckedChange={setShowAvailableOnly}
            />
            <Label htmlFor="available-only">Show only bands available on selected date</Label>
          </div>
          
          {/* Tabs for Map and List Views */}
          <Tabs defaultValue="map-view" value={activeTab} onValueChange={handleTabChange}>
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="map-view">Map View</TabsTrigger>
                <TabsTrigger value="list-view">List View</TabsTrigger>
              </TabsList>
              
              <div className="text-sm text-muted-foreground">
                Showing {filteredBands.length} bands
              </div>
            </div>
            
            {/* Map View Tab */}
            <TabsContent value="map-view" className="space-y-4">
              <div className="rounded-md overflow-hidden border">
                <LoadScript
                  googleMapsApiKey={googleMapsApiKey}
                >
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={mapCenter}
                    zoom={10}
                  >
                    {/* Venue marker */}
                    {activeVenue && activeVenue.latitude && activeVenue.longitude && (
                      <Marker
                        position={{ lat: parseFloat(activeVenue.latitude), lng: parseFloat(activeVenue.longitude) }}
                        icon={{
                          path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                          fillColor: '#1e40af',
                          fillOpacity: 1,
                          strokeWeight: 1,
                          strokeColor: '#fff',
                          scale: 1.5,
                        }}
                      />
                    )}
                    
                    {/* Band markers */}
                    {filteredBands.map(band => (
                      <Marker
                        key={band.id}
                        position={{ 
                          // Random positions around the venue for illustration
                          lat: (mapCenter.lat + (Math.random() * 0.1 - 0.05)), 
                          lng: (mapCenter.lng + (Math.random() * 0.1 - 0.05)) 
                        }}
                        onClick={() => handleMarkerClick(band)}
                        animation={window.google?.maps.Animation.DROP}
                        icon={{
                          path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
                          fillColor: `hsl(${band.matchPercentage}, 70%, 50%)`,
                          fillOpacity: 0.9,
                          strokeWeight: 1,
                          strokeColor: '#fff',
                          scale: 1.2
                        }}
                      />
                    ))}
                    
                    {/* InfoWindow for selected marker */}
                    {selectedMarker && (
                      <InfoWindow
                        position={{ 
                          lat: (mapCenter.lat + (Math.random() * 0.1 - 0.05)), 
                          lng: (mapCenter.lng + (Math.random() * 0.1 - 0.05)) 
                        }}
                        onCloseClick={() => setSelectedMarker(null)}
                      >
                        <div className="p-2 max-w-xs">
                          <h3 className="font-semibold text-lg">{selectedMarker.name}</h3>
                          <div className="flex gap-1 my-1 flex-wrap">
                            {selectedMarker.genres.map(genre => (
                              <Badge key={genre} variant="outline">{genre}</Badge>
                            ))}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm">{selectedMarker.drawSizeCategory} draw</span>
                            <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                              {selectedMarker.matchPercentage}% match
                            </div>
                          </div>
                          <Button 
                            className="w-full mt-2" 
                            size="sm"
                            onClick={() => handleBandSelect(selectedMarker)}
                          >
                            View Details
                          </Button>
                        </div>
                      </InfoWindow>
                    )}
                  </GoogleMap>
                </LoadScript>
              </div>
            </TabsContent>
            
            {/* List View Tab */}
            <TabsContent value="list-view">
              <div className="space-y-4">
                {filteredBands.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No bands match your current filters</p>
                  </div>
                ) : (
                  filteredBands.map(band => (
                    <Card 
                      key={band.id}
                      className={`cursor-pointer hover:border-primary transition-all ${selectedBand?.id === band.id ? 'border-primary' : ''}`}
                      onClick={() => handleBandSelect(band)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-xl">{band.name}</CardTitle>
                          <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                            {band.matchPercentage}% match
                          </div>
                        </div>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {band.genres.map(genre => (
                            <Badge key={genre} variant="outline">{genre}</Badge>
                          ))}
                          <Badge variant="secondary">{band.drawSizeCategory}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {band.description || "A talented band with a unique sound and growing audience. Currently on tour across North America."}
                        </p>
                        
                        <div className="mt-2 flex items-center text-sm">
                          <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Last in your area: February 2025
                          </span>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-2">
                        <div className="w-full flex justify-between items-center">
                          <span className="text-sm font-medium flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>Next show: 78 miles away</span>
                          </span>
                          <Button variant="outline" size="sm">View Details</Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>
        
        {/* Tour Routes View Mode */}
        <TabsContent value="tours" className="mt-0">
          <div className="mb-6">
            <h2 className="text-xl font-medium mb-2">Touring Bands</h2>
            <p className="text-muted-foreground">
              View artist tour routes to discover bands coming through your area
            </p>
            
            {/* Filter Cards - Simplified for tour view */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Music className="mr-2 h-4 w-4" />
                    Genre
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {genreOptions.slice(0, 6).map(genre => (
                      <div key={genre} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`tour-genre-${genre}`}
                          checked={genreFilters.includes(genre)}
                          onCheckedChange={() => handleGenreFilterChange(genre)}
                        />
                        <Label htmlFor={`tour-genre-${genre}`}>{genre}</Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Users className="mr-2 h-4 w-4" />
                    Draw Size
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {drawSizeOptions.map(size => (
                      <Button 
                        key={size}
                        variant={drawSizeFilter === size ? "default" : "outline"}
                        className="mr-2 mb-2"
                        onClick={() => handleDrawSizeFilterChange(size)}
                      >
                        {size}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Tour map view */}
          <div className="bg-white rounded-lg p-4 border">
            {isLoadingTourDates || isLoadingTours ? (
              <div className="flex items-center justify-center h-[500px]">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-primary font-medium">Loading Tour Data...</p>
                </div>
              </div>
            ) : (
              renderTourRoutes()
            )}
          </div>
          
          <div className="mt-4 px-4 py-3 bg-muted rounded-md">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="font-medium">Legend:</div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <span className="text-sm">Confirmed Date</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                <span className="text-sm">Pending Date</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                <span className="text-sm">Open Date</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                <span className="text-sm">Your Venue</span>
              </div>
            </div>
          </div>
        </TabsContent>
      </div>
      
      {/* Band Detail Modal */}
      <BandDetailModal 
        band={selectedBand as any}
        isOpen={isBandDetailOpen}
        onClose={() => setIsBandDetailOpen(false)}
      />
    </div>
  );
}