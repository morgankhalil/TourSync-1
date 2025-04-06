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
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Calendar as CalendarIcon, Filter, Music, Users, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Band, Tour, Venue } from '@shared/schema';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { VenueCalendarSidebar } from '@/components/venue/VenueCalendarSidebar';

// Import our real matching algorithm
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

// Default map center (adjust based on venue location)
const center = {
  lat: 40.7128, // New York City coordinates as default
  lng: -74.006
};

export function OpportunityDiscovery() {
  const [activeTab, setActiveTab] = useState('map-view');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [distanceFilter, setDistanceFilter] = useState([50]); // Miles
  const [genreFilters, setGenreFilters] = useState<string[]>([]);
  const [drawSizeFilter, setDrawSizeFilter] = useState<string>('');
  const [showAvailableOnly, setShowAvailableOnly] = useState(true);
  const [selectedBand, setSelectedBand] = useState<BandWithMatch | null>(null);
  const [mapCenter, setMapCenter] = useState(center);
  const [selectedMarker, setSelectedMarker] = useState<BandWithMatch | null>(null);
  const [activeVenue, setActiveVenue] = useState<Venue | null>(null);
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string>("");
  
  // Fetch bands
  const { data: bands = [], isLoading: isLoadingBands } = useQuery<Band[]>({
    queryKey: ['/api/bands'],
    retry: false
  });

  // Fetch venues for the current user
  const { data: venues = [], isLoading: isLoadingVenues } = useQuery<Venue[]>({
    queryKey: ['/api/venues'],
    retry: false
  });
  
  // Process bands with match percentage
  const processedBands: BandWithMatch[] = React.useMemo(() => {
    if (!bands || !activeVenue) return [];
    
    return bands.map((band: Band) => {
      // Calculate real match percentage using our algorithm
      const matchPercent = activeVenue ? calculateBandVenueMatch(band, activeVenue) : 70;
      
      // Determine draw size category based on actual draw size
      let drawSizeCategory = 'Unknown';
      if (band.drawSize) {
        if (band.drawSize < 100) drawSizeCategory = 'Small (0-100)';
        else if (band.drawSize < 300) drawSizeCategory = 'Medium (100-300)';
        else drawSizeCategory = 'Large (300+)';
      }
      
      // Extract genres from band data or use defaults
      const genreList = band.genre 
        ? band.genre.split(',').map(g => g.trim()) 
        : ['Rock', 'Indie', 'Alternative'].slice(0, Math.floor(Math.random() * 3) + 1);
      
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

  // Set active venue
  useEffect(() => {
    if (venues && venues.length > 0) {
      const venue = venues[0];
      setActiveVenue(venue);
      
      // Update map center to venue's location
      if (venue.latitude && venue.longitude) {
        setMapCenter({
          lat: parseFloat(venue.latitude),
          lng: parseFloat(venue.longitude)
        });
      }
    }
  }, [venues]);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
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
  };
  
  const handleMarkerClick = (band: BandWithMatch) => {
    setSelectedMarker(band);
  };
  
  // Genres for filtering
  const genreOptions = ['Rock', 'Pop', 'Hip Hop', 'Electronic', 'Jazz', 'Indie', 'Metal', 'Country', 'Alternative'];
  
  // Draw size options
  const drawSizeOptions = ['Small (0-100)', 'Medium (100-300)', 'Large (300+)'];

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
            <h1 className="text-3xl font-bold mb-2">Opportunity Discovery</h1>
            <p className="text-muted-foreground">
              Find bands that are touring near {activeVenue?.name || 'your venue'} around {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'selected dates'}
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Select value={activeVenue?.id?.toString() || ''} onValueChange={(value) => {
              const venue = venues?.find((v: Venue) => v.id.toString() === value);
              if (venue) {
                setActiveVenue(venue);
                if (venue.latitude && venue.longitude) {
                  setMapCenter({
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
        
        {/* Filter Cards */}
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
        
        {/* Availability Switch */}
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
                      animation={window.google?.maps.Animation.BOUNCE}
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
                        <div className="flex gap-1 my-1">
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
                          onClick={() => setSelectedBand(selectedMarker)}
                        >
                          View Details
                        </Button>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </LoadScript>
            </div>
            
            {/* Selected Band Card */}
            {selectedBand && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle>{selectedBand.name}</CardTitle>
                    <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                      {selectedBand.matchPercentage}% match
                    </div>
                  </div>
                  <CardDescription>
                    {selectedBand.genres.join(', ')} • {selectedBand.drawSizeCategory} draw
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-1">Current Tour</h4>
                      <p className="text-sm text-muted-foreground">
                        Summer Tour 2025 • 
                        April 10 - June 15, 2025 • 
                        22 shows
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-1">Next shows near you:</h4>
                      <ul className="text-sm space-y-1">
                        <li className="flex justify-between">
                          <span>Apr 12 - The Hollow (Albany, NY)</span>
                          <span className="text-muted-foreground">78 miles</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Apr 14 - Paradise Rock Club (Boston, MA)</span>
                          <span className="text-muted-foreground">120 miles</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-1">About</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedBand.description || "Energetic indie rock band with a growing fanbase across North America. Known for their engaging live performances and loyal fan following."}
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline">View Tour</Button>
                  <Button>Contact Band</Button>
                </CardFooter>
              </Card>
            )}
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
                      <div className="flex gap-2 mt-1">
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
      </div>
    </div>
  );
}