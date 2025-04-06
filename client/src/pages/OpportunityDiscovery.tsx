import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { DatePicker } from "../components/ui/date-picker";
import { useActiveVenue } from "@/hooks/useActiveVenue";
import { useVenues } from "@/hooks/useVenues";
import { Separator } from "@/components/ui/separator";
import { 
  Building2, 
  Calendar, 
  CalendarDays, 
  ChevronDown, 
  Compass, 
  Contact, 
  Map, 
  MessageCircle, 
  Music 
} from "lucide-react";
import { Venue } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { format, addDays } from "date-fns";

type TouringBand = {
  id: number;
  name: string;
  description: string | null;
  contactEmail: string;
  contactPhone: string | null;
  genre: string | null;
  social: any;
  touring: {
    tourId: number;
    tourName: string;
    startDate: string;
    endDate: string;
    latitude: string;
    longitude: string;
    distance: number;
    routeColor?: string;
    venues?: Array<{
      name: string;
      address: string;
      date: string;
    }>;
    route: Array<{lat: number, lng: number}>;
  };
  drawSize: string;
  matchScore: number;
};

export default function OpportunityDiscovery() {
  const { toast } = useToast();
  const { activeVenue, setActiveVenue } = useActiveVenue();
  const { venues } = useVenues();
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [radius, setRadius] = useState<number>(50);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [selectedBand, setSelectedBand] = useState<TouringBand | null>(null);
  const [dateRange, setDateRange] = useState<{start: Date | undefined, end: Date | undefined}>({
    start: new Date(),
    end: addDays(new Date(), 30)
  });
  
  // Filter states
  const [genreFilters, setGenreFilters] = useState<string[]>([]);
  const [drawSizeFilter, setDrawSizeFilter] = useState<string>("");
  const [minMatchScore, setMinMatchScore] = useState<number>(70);
  
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const bandsMapRef = useRef<Map<number, any>>(new Map());
  const infoWindowRef = useRef<any>(null);
  
  // Fetch API key for Google Maps
  const { data: mapsApiData } = useQuery({ 
    queryKey: ['/api/maps/api-key'],
    staleTime: Infinity,
  });
  
  // Load Google Maps script dynamically
  useEffect(() => {
    if (!mapsApiData?.apiKey || mapLoaded) return;
    
    // Create script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsApiData.apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, [mapsApiData?.apiKey, mapLoaded]);
  
  // Initialize map after script loads
  useEffect(() => {
    if (!mapLoaded || !selectedVenue) return;
    
    // Initialize Google Maps
    if (!mapRef.current) {
      const google = window.google;
      const mapOptions = {
        center: { 
          lat: parseFloat(selectedVenue.latitude), 
          lng: parseFloat(selectedVenue.longitude) 
        },
        zoom: 9,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
      };
      
      const map = new google.maps.Map(document.getElementById("map"), mapOptions);
      mapRef.current = map;
      
      // Create info window
      infoWindowRef.current = new google.maps.InfoWindow();
      
      // Add venue marker
      new google.maps.Marker({
        position: { 
          lat: parseFloat(selectedVenue.latitude), 
          lng: parseFloat(selectedVenue.longitude) 
        },
        map,
        title: selectedVenue.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: "#3b82f6",
          fillOpacity: 1,
          strokeWeight: 0,
          scale: 10,
        },
      });
      
      // Add a radius circle
      new google.maps.Circle({
        strokeColor: "#3b82f6",
        strokeOpacity: 0.2,
        strokeWeight: 2,
        fillColor: "#3b82f6",
        fillOpacity: 0.1,
        map,
        center: { 
          lat: parseFloat(selectedVenue.latitude), 
          lng: parseFloat(selectedVenue.longitude) 
        },
        radius: radius * 1609.34, // miles to meters
      });
    }
  }, [mapLoaded, selectedVenue, radius]);
  
  // Init venue select
  useEffect(() => {
    if (activeVenue) {
      setSelectedVenue(activeVenue);
    } else if (venues?.length > 0) {
      setSelectedVenue(venues[0]);
      setActiveVenue(venues[0]);
    }
  }, [venues, activeVenue, setActiveVenue]);
  
  // Fetch touring bands
  const { data: touringBands = [], isLoading } = useQuery<TouringBand[]>({
    queryKey: ['/api/bands/touring', selectedVenue?.id, radius],
    enabled: !!selectedVenue,
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedVenue) params.append('venueId', selectedVenue.id.toString());
      if (radius) params.append('radius', radius.toString());
      // We'll re-add date filtering later once the basic functionality works
      // if (dateRange.start) params.append('startDate', dateRange.start.toISOString());
      // if (dateRange.end) params.append('endDate', dateRange.end.toISOString());
      
      return apiRequest(`/api/bands/touring?${params.toString()}`);
    }
  });
  
  // Update map markers when bands data changes
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !touringBands?.length) return;
    
    const google = window.google;
    
    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    bandsMapRef.current.clear();
    
    // Add band markers
    touringBands.forEach(band => {
      if (!band.touring) return;
      
      const bandMarker = new google.maps.Marker({
        position: { 
          lat: parseFloat(band.touring.latitude), 
          lng: parseFloat(band.touring.longitude) 
        },
        map: mapRef.current,
        title: band.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: "#ef4444",
          fillOpacity: 0.8,
          strokeWeight: 1,
          strokeColor: "#ffffff",
          scale: 8,
        },
      });
      
      // Add click listener
      bandMarker.addListener("click", () => {
        setSelectedBand(band);
        
        // Get venue information from the first venue in the tour
        const venueInfo = band.touring.venues && band.touring.venues.length > 0
          ? band.touring.venues[0]
          : null;
        
        // Open info window with more detailed information
        infoWindowRef.current.setContent(
          `<div class="p-3">
            <div class="text-sm font-semibold">${band.name}</div>
            <div class="text-xs">${band.genre || 'Unknown genre'}</div>
            <div class="text-xs">Tour: ${band.touring.tourName}</div>
            ${venueInfo ? `
              <div class="mt-2 text-xs font-semibold">${venueInfo.name}</div>
              <div class="text-xs">${venueInfo.address}</div>
              <div class="text-xs">Concert date: ${venueInfo.date}</div>
            ` : ''}
          </div>`
        );
        infoWindowRef.current.open(mapRef.current, bandMarker);
      });
      
      markersRef.current.push(bandMarker);
      bandsMapRef.current.set(band.id, bandMarker);
      
      // Add route lines if available
      if (band.touring.route && band.touring.route.length) {
        const routePath = new google.maps.Polyline({
          path: band.touring.route,
          geodesic: true,
          strokeColor: band.touring.routeColor || "#ef4444", // Use band's route color or default to red
          strokeOpacity: 0.5,
          strokeWeight: 2,
        });
        
        routePath.setMap(mapRef.current);
        markersRef.current.push(routePath);
      }
      
      // Add venue markers for each stop on the tour route
      if (band.touring.venues && band.touring.venues.length) {
        band.touring.venues.forEach((venueInfo, index) => {
          if (index === 0) return; // Skip the first venue as it's already covered by the band marker
          
          const position = band.touring.route && band.touring.route[index] 
            ? band.touring.route[index] 
            : null;
            
          if (!position) return;
          
          const venueMarker = new google.maps.Marker({
            position: position,
            map: mapRef.current,
            title: venueInfo.name,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: band.touring.routeColor || "#ef4444",
              fillOpacity: 0.4,
              strokeWeight: 1,
              strokeColor: "#ffffff",
              scale: 5,
            },
          });
          
          // Add click listener for venue markers
          venueMarker.addListener("click", () => {
            // Open info window with venue details
            infoWindowRef.current.setContent(
              `<div class="p-2">
                <div class="text-sm font-semibold">${venueInfo.name}</div>
                <div class="text-xs">${venueInfo.address}</div>
                <div class="text-xs">Concert date: ${venueInfo.date}</div>
                <div class="text-xs">Band: ${band.name}</div>
                <div class="text-xs">Tour: ${band.touring.tourName}</div>
              </div>`
            );
            infoWindowRef.current.open(mapRef.current, venueMarker);
          });
          
          markersRef.current.push(venueMarker);
        });
      }
    });
  }, [touringBands, mapLoaded]);
  
  // Apply filters to bands
  const filteredBands = touringBands?.filter(band => {
    // Apply genre filter if selected
    if (genreFilters.length > 0 && band.genre) {
      if (!genreFilters.some(g => band.genre?.toLowerCase().includes(g.toLowerCase()))) {
        return false;
      }
    }
    
    // Apply draw size filter if selected
    if (drawSizeFilter && band.drawSize !== drawSizeFilter) {
      return false;
    }
    
    // Apply match score filter
    if (band.matchScore < minMatchScore) {
      return false;
    }
    
    return true;
  });
  
  // Handle venue change
  const handleVenueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const venueId = parseInt(e.target.value);
    const venue = venues?.find(v => v.id === venueId);
    if (venue) {
      setSelectedVenue(venue);
      setActiveVenue(venue);
    }
  };
  
  // Handle radius change
  const handleRadiusChange = (value: number[]) => {
    setRadius(value[0]);
    
    // Update circle radius if map is loaded
    if (mapLoaded && mapRef.current && selectedVenue) {
      const google = window.google;
      
      // Clear existing circle
      markersRef.current.forEach(marker => {
        if (marker instanceof google.maps.Circle) {
          marker.setMap(null);
        }
      });
      
      // Add new circle
      const circle = new google.maps.Circle({
        strokeColor: "#3b82f6",
        strokeOpacity: 0.2,
        strokeWeight: 2,
        fillColor: "#3b82f6",
        fillOpacity: 0.1,
        map: mapRef.current,
        center: { 
          lat: parseFloat(selectedVenue.latitude), 
          lng: parseFloat(selectedVenue.longitude) 
        },
        radius: value[0] * 1609.34, // miles to meters
      });
      
      markersRef.current.push(circle);
    }
  };
  
  // Handle band card click
  const handleBandCardClick = (band: TouringBand) => {
    setSelectedBand(band);
    
    // Center map and open info window if marker exists
    if (mapLoaded && mapRef.current && bandsMapRef.current.has(band.id)) {
      const marker = bandsMapRef.current.get(band.id);
      mapRef.current.panTo(marker.getPosition());
      mapRef.current.setZoom(11);
      
      // Get venue information from the first venue in the tour
      const venueInfo = band.touring.venues && band.touring.venues.length > 0
        ? band.touring.venues[0]
        : null;
      
      // Open info window with more detailed information
      infoWindowRef.current.setContent(
        `<div class="p-3">
          <div class="text-sm font-semibold">${band.name}</div>
          <div class="text-xs">${band.genre || 'Unknown genre'}</div>
          <div class="text-xs">Tour: ${band.touring.tourName}</div>
          ${venueInfo ? `
            <div class="mt-2 text-xs font-semibold">${venueInfo.name}</div>
            <div class="text-xs">${venueInfo.address}</div>
            <div class="text-xs">Concert date: ${venueInfo.date}</div>
          ` : ''}
        </div>`
      );
      infoWindowRef.current.open(mapRef.current, marker);
    }
  };
  
  // Get available genres from bands
  const availableGenres = Array.from(
    new Set(
      touringBands
        ?.filter(band => band.genre)
        .map(band => band.genre?.split(',').map(g => g.trim()))
        .flat()
        .filter(Boolean) as string[]
    )
  );
  
  // Handle genre filter change
  const handleGenreFilterChange = (genre: string) => {
    if (genreFilters.includes(genre)) {
      setGenreFilters(genreFilters.filter(g => g !== genre));
    } else {
      setGenreFilters([...genreFilters, genre]);
    }
  };
  
  // Handle contact band button
  const handleContactBand = (band: TouringBand) => {
    toast({
      title: "Contact Info",
      description: `Contact ${band.name} at ${band.contactEmail || 'No email available'}`,
    });
  };
  
  // Handle date change
  const handleStartDateChange = (date: Date | undefined) => {
    setDateRange({...dateRange, start: date});
  };
  
  const handleEndDateChange = (date: Date | undefined) => {
    setDateRange({...dateRange, end: date});
  };
  
  return (
    <div className="flex flex-col flex-1 overflow-hidden h-full">
      <div className="flex flex-col md:flex-row h-full">
        {/* Left side - Map and controls */}
        <div className="w-full md:w-2/3 flex flex-col h-full">
          <div className="p-4 bg-white border-b">
            <h1 className="text-2xl font-bold mb-4 flex items-center">
              <Compass className="w-6 h-6 mr-2 text-primary" />
              Opportunity Discovery
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="venue">Select Your Venue</Label>
                <select
                  id="venue"
                  className="w-full p-2 border rounded mt-1"
                  value={selectedVenue?.id || ""}
                  onChange={handleVenueChange}
                >
                  {venues?.map(venue => (
                    <option key={venue.id} value={venue.id}>
                      {venue.name} - {venue.city}, {venue.state}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label>Search Radius: {radius} miles</Label>
                <Slider
                  id="radius"
                  className="mt-2"
                  defaultValue={[radius]}
                  max={100}
                  min={10}
                  step={5}
                  onValueChange={handleRadiusChange}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <DatePicker date={dateRange.start} setDate={handleStartDateChange} className="mt-1" />
              </div>
              <div>
                <Label>End Date</Label>
                <DatePicker date={dateRange.end} setDate={handleEndDateChange} className="mt-1" />
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden" id="map" style={{ height: "calc(100% - 232px)" }}>
            {!mapLoaded && (
              <div className="h-full flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4">Loading map...</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Right side - Band listing */}
        <div className="w-full md:w-1/3 border-l overflow-hidden flex flex-col h-full">
          <div className="p-4 border-b bg-white">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Touring Bands Nearby</h2>
              <Badge variant="outline" className="font-normal">
                {filteredBands?.length || 0} bands
              </Badge>
            </div>
            
            <div className="flex flex-wrap gap-1 my-2">
              {availableGenres.map(genre => (
                <Badge 
                  key={genre} 
                  variant={genreFilters.includes(genre) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleGenreFilterChange(genre)}
                >
                  {genre}
                </Badge>
              ))}
            </div>
            
            <div className="grid grid-cols-1 gap-2 mt-2">
              <div>
                <Label className="text-xs">Draw Size</Label>
                <RadioGroup 
                  className="flex space-x-1 mt-1"
                  value={drawSizeFilter}
                  onValueChange={setDrawSizeFilter}
                >
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="" id="all" className="h-3 w-3" />
                    <Label htmlFor="all" className="text-xs">All</Label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="0-100" id="small" className="h-3 w-3" />
                    <Label htmlFor="small" className="text-xs">0-100</Label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="100-200" id="medium" className="h-3 w-3" />
                    <Label htmlFor="medium" className="text-xs">100-200</Label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="200-300" id="large" className="h-3 w-3" />
                    <Label htmlFor="large" className="text-xs">200-300</Label>
                  </div>
                  <div className="flex items-center space-x-1">
                    <RadioGroupItem value="300+" id="xl" className="h-3 w-3" />
                    <Label htmlFor="xl" className="text-xs">300+</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div>
                <Label className="text-xs">Minimum Match Score: {minMatchScore}%</Label>
                <Slider
                  defaultValue={[minMatchScore]}
                  max={100}
                  min={50}
                  step={5}
                  className="mt-1"
                  onValueChange={(value) => setMinMatchScore(value[0])}
                />
              </div>
            </div>
          </div>
          
          <div className="overflow-auto flex-1">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4">Loading touring bands...</p>
              </div>
            ) : filteredBands?.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No bands found matching your criteria.</p>
                <p className="text-sm mt-2">Try adjusting your filters or increasing the search radius.</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredBands?.map(band => (
                  <div 
                    key={band.id} 
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedBand?.id === band.id ? 'bg-gray-50' : ''}`}
                    onClick={() => handleBandCardClick(band)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{band.name}</h3>
                        <p className="text-sm text-gray-600">{band.genre || 'No genre specified'}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                        {band.matchScore}% match
                      </Badge>
                    </div>
                    
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="flex items-center gap-1 font-normal">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(band.touring.startDate), "MMM d")} - {format(new Date(band.touring.endDate), "MMM d")}
                      </Badge>
                      
                      <Badge variant="outline" className="flex items-center gap-1 font-normal">
                        <Music className="w-3 h-3" />
                        Draw: {band.drawSize}
                      </Badge>
                    </div>
                    
                    <div className="mt-3 flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs h-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContactBand(band);
                        }}
                      >
                        <MessageCircle className="w-3 h-3 mr-1" />
                        Contact Band
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Selected band details modal */}
      {selectedBand && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedBand(null)}>
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-xl font-bold">{selectedBand.name}</h2>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                  {selectedBand.matchScore}% match
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="flex items-center gap-1 font-normal">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(selectedBand.touring.startDate), "MMM d")} - {format(new Date(selectedBand.touring.endDate), "MMM d")}
                </Badge>
                
                <Badge variant="outline" className="flex items-center gap-1 font-normal">
                  <Music className="w-3 h-3" />
                  Draw Size: {selectedBand.drawSize}
                </Badge>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-600">{selectedBand.genre}</p>
                <p className="mt-2">{selectedBand.description || 'No description available.'}</p>
              </div>
              
              {/* Tour Information */}
              <div className="rounded-lg bg-gray-50 p-3 mb-4">
                <h3 className="font-semibold text-sm flex items-center">
                  <Map className="h-4 w-4 mr-1 text-primary" />
                  Tour Information
                </h3>
                <p className="text-sm mt-1">
                  <span className="font-medium">{selectedBand.touring.tourName}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Distance from venue: <span className="font-medium">{Math.round(selectedBand.touring.distance)} miles</span>
                </p>
              </div>
              
              {/* Venue Information */}
              {selectedBand.touring.venues && selectedBand.touring.venues.length > 0 && (
                <div className="rounded-lg bg-gray-50 p-3 mb-4">
                  <h3 className="font-semibold text-sm flex items-center">
                    <Building2 className="h-4 w-4 mr-1 text-primary" />
                    Upcoming Performances
                  </h3>
                  <div className="space-y-3 mt-2">
                    {selectedBand.touring.venues.map((venueInfo, index) => (
                      <div key={index} className="text-sm">
                        <div className="font-medium">{venueInfo.name}</div>
                        <div className="text-gray-600">{venueInfo.address}</div>
                        <div className="text-gray-600">
                          <CalendarDays className="h-3 w-3 inline-block mr-1" />
                          {format(new Date(venueInfo.date), "EEE, MMM d, yyyy")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Contact Information */}
              <div className="rounded-lg bg-gray-50 p-3 mb-4">
                <h3 className="font-semibold text-sm flex items-center">
                  <Contact className="h-4 w-4 mr-1 text-primary" />
                  Contact Information
                </h3>
                <p className="text-sm mt-1">
                  Email: <span className="font-medium">{selectedBand.contactEmail}</span>
                </p>
                {selectedBand.contactPhone && (
                  <p className="text-sm">
                    Phone: <span className="font-medium">{selectedBand.contactPhone}</span>
                  </p>
                )}
                {selectedBand.social && Object.keys(selectedBand.social).length > 0 && (
                  <div className="mt-1 text-sm">
                    Social:
                    <div className="flex gap-2 mt-1">
                      {Object.entries(selectedBand.social).map(([platform, handle]) => (
                        <Badge key={platform} variant="outline">
                          {platform}: {handle}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 grid grid-cols-2 gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setSelectedBand(null)}
                >
                  Close
                </Button>
                <Button 
                  onClick={() => handleContactBand(selectedBand)}
                >
                  Contact Band
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}