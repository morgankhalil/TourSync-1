import { useEffect, useState } from "react";
import { useActiveVenue } from "../hooks/useActiveVenue";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnhancedBandsintownDiscoveryClient, DiscoveryResult, DiscoveryStats } from "@/services/bandsintown-discovery-v2";
import { EnhancedBandMapView } from "../components/maps/EnhancedBandMapView";
import { SimpleMapView } from "../components/maps/SimpleMapView";
import { BasicMapView } from "../components/maps/BasicMapView";
import { InteractiveMapView } from "../components/maps/InteractiveMapView";
import { AlertCircle, CalendarDays, Info, MapPin, AlertTriangle, RefreshCw, Music, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { format, addDays } from "date-fns";
import { DatePicker } from "../components/DatePicker";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getFitDescription, generateRoutingDescription, getDaysDescription, getDetourDescription } from "@/lib/routing-utils";

export default function EnhancedArtistDiscovery() {
  // Use the venue property from context for consistency
  const { venue: activeVenue } = useActiveVenue();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<DiscoveryResult[]>([]);
  const [searchStats, setSearchStats] = useState<DiscoveryStats | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<DiscoveryResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Search parameters - wider defaults for better results
  const today = new Date();
  const [startDate, setStartDate] = useState<Date>(today);
  const [endDate, setEndDate] = useState<Date>(addDays(today, 180));  // 6 months instead of 90 days
  const [radius, setRadius] = useState(200);  // 200 miles instead of 100
  const [maxResults, setMaxResults] = useState(20);
  const [lookAheadDays, setLookAheadDays] = useState(180);  // 6 months instead of 90 days
  const [useEnhancedDiscovery, setUseEnhancedDiscovery] = useState(true);
  const [useDemoMode, setUseDemoMode] = useState(false);
  
  // Reset when venue changes 
  useEffect(() => {
    console.log("Venue changed to:", activeVenue);
    setSearchResults([]);
    setSelectedArtist(null);
    setErrorMessage(null);
    
    // Add a notification when venue changes
    if (activeVenue) {
      toast({
        title: "Venue Changed",
        description: `Selected venue is now ${activeVenue.name} (ID: ${activeVenue.id})`
      });
    }
  }, [activeVenue, toast]);

  // Handle incremental search results
  const handleViewArtist = (artist: DiscoveryResult) => {
    console.log("View artist details:", artist.name);
    setSelectedArtist(artist);
    
    // Use a timeout to ensure the state update completes first
    setTimeout(() => {
      // Find and click the details tab
      const detailsTab = document.querySelector('button[value="details"]');
      if (detailsTab) {
        console.log("Found details tab, clicking it");
        (detailsTab as HTMLElement).click();
      } else {
        console.log("Details tab not found");
      }
    }, 100);
  };
  
  const handleIncrementalResults = (newResults: DiscoveryResult[]) => {
    console.log("Received incremental results:", newResults.length);
    
    // Update the search results with the new ones
    setSearchResults(prevResults => {
      // Create a map of existing results by name to avoid duplicates
      const existingResultsMap = new Map(prevResults.map(result => [result.name, result]));
      
      // Add new results if they don't already exist
      newResults.forEach(result => {
        if (!existingResultsMap.has(result.name)) {
          console.log("Adding new result:", result.name);
          existingResultsMap.set(result.name, result);
        }
      });
      
      // Convert back to array and sort by routing score (lower is better)
      const updatedResults = Array.from(existingResultsMap.values())
        .sort((a, b) => a.route.routingScore - b.route.routingScore);
      
      return updatedResults;
    });
    
    // Update the stats
    setSearchStats(prevStats => {
      if (!prevStats) {
        return {
          artistsQueried: 0,
          artistsWithEvents: 0,
          artistsPassingNear: newResults.length,
          totalEventsFound: 0,
          elapsedTimeMs: 0,
          apiCacheStats: { keys: 0, hits: 0, misses: 0 }
        };
      }
      
      return {
        ...prevStats,
        artistsPassingNear: prevStats.artistsPassingNear + newResults.length
      };
    });
    
    // Toast to show incremental results
    if (newResults.length > 0) {
      toast({
        title: "New Match Found!",
        description: `Found ${newResults.length} new band(s) passing near ${activeVenue?.name}`,
        duration: 3000,
      });
    }
  };

  // Direct Demo Mode Implementation
  const generateDemoResults = () => {
    // Create several demo bands to simulate incremental results
    const demoBands = [
      {
        name: "The Roadtrippers",
        image: "https://picsum.photos/id/1/400/400",
        genre: "Indie Rock",
        routingScore: 15,
        distanceToVenue: 45,
        detourDistance: 10,
        daysAvailable: 2,
        originCity: "Buffalo",
        originState: "NY",
        destCity: "Pittsburgh", 
        destState: "PA",
      },
      {
        name: "Midnight Drivers",
        image: "https://picsum.photos/id/25/400/400",
        genre: "Alternative",
        routingScore: 30,
        distanceToVenue: 65,
        detourDistance: 25,
        daysAvailable: 3,
        originCity: "Toronto",
        originState: "ON",
        destCity: "Cleveland", 
        destState: "OH",
      },
      {
        name: "Coast to Coast",
        image: "https://picsum.photos/id/65/400/400",
        genre: "Folk",
        routingScore: 45,
        distanceToVenue: 120,
        detourDistance: 40,
        daysAvailable: 4,
        originCity: "Syracuse",
        originState: "NY",
        destCity: "Columbus", 
        destState: "OH",
      }
    ];
    
    return demoBands.map((band, index) => {
      const now = new Date();
      const dayAfter = new Date(now);
      dayAfter.setDate(dayAfter.getDate() + (index * 2 + 1));
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + (index * 3 + 7));
      
      return {
        name: band.name,
        image: band.image,
        url: "https://bandsintown.com",
        upcomingEvents: 8 + index * 4,
        route: {
          origin: {
            city: band.originCity,
            state: band.originState,
            date: dayAfter.toISOString().substring(0, 10),
            lat: 42.8864 + index,
            lng: -78.8784 - index
          },
          destination: {
            city: band.destCity,
            state: band.destState,
            date: nextWeek.toISOString().substring(0, 10),
            lat: 40.4406 - index,
            lng: -79.9959 + index
          },
          distanceToVenue: band.distanceToVenue,
          detourDistance: band.detourDistance,
          daysAvailable: band.daysAvailable,
          routingScore: band.routingScore
        },
        events: [{
          id: `demo-orig-${index}`,
          datetime: dayAfter.toISOString(),
          venue: {
            name: band.originCity + " Music Hall",
            city: band.originCity,
            region: band.originState,
            country: "US",
            latitude: "42.8864",
            longitude: "-78.8784"
          }
        }, {
          id: `demo-dest-${index}`,
          datetime: nextWeek.toISOString(),
          venue: {
            name: band.destCity + " Arena",
            city: band.destCity,
            region: band.destState,
            country: "US",
            latitude: "40.4406",
            longitude: "-79.9959"
          }
        }],
        genre: band.genre,
        drawSize: 150 + index * 50
      } as DiscoveryResult;
    });
  };
  
  // Handle search
  const handleSearch = async () => {
    if (!activeVenue) {
      toast({
        title: "No venue selected",
        description: "Please select a venue first.",
        variant: "destructive",
      });
      return;
    }

    // Log current venue to help with debugging
    console.log("Current activeVenue:", activeVenue);

    setIsLoading(true);
    setErrorMessage(null);
    setSearchResults([]);
    setSelectedArtist(null);
    
    // Special handling for demo mode
    if (useDemoMode) {
      console.log("Using demo mode - generating immediate fake results");
      
      // Set a fake loading state
      const demoResults = generateDemoResults();
      
      // Show first result with a slight delay
      setTimeout(() => {
        const first = [demoResults[0]];
        handleIncrementalResults(first);
        
        // Show second result with a delay
        setTimeout(() => {
          const second = [demoResults[1]]; 
          handleIncrementalResults(second);
          
          // Show third result with another delay
          setTimeout(() => {
            const third = [demoResults[2]];
            handleIncrementalResults(third);
            
            // Complete the search
            setTimeout(() => {
              setSearchStats({
                artistsQueried: 100,
                artistsWithEvents: 50,
                artistsPassingNear: 3,
                totalEventsFound: 150,
                elapsedTimeMs: 5000,
                apiCacheStats: { keys: 100, hits: 50, misses: 50 }
              });
              
              toast({
                title: "Search Complete",
                description: `Found ${demoResults.length} bands passing near ${activeVenue.name}`,
              });
              
              setIsLoading(false);
            }, 1000);
          }, 1500);
        }, 1500);
      }, 1000);
      
      return;
    }

    try {
      // Get the formatted date strings
      const formattedStartDate = format(startDate, "yyyy-MM-dd");
      const formattedEndDate = format(endDate, "yyyy-MM-dd");
      
      console.log(`Starting enhanced discovery search for venue ${activeVenue.id} from ${formattedStartDate} to ${formattedEndDate}`);
      
      // First check the API status
      const statusCheck = await EnhancedBandsintownDiscoveryClient.checkStatus();
      if (statusCheck.status !== 'ok') {
        throw new Error(`Bandsintown API status check failed: ${statusCheck.message || 'Unknown error'}`);
      }
      
      // Clear Bandsintown cache to ensure fresh results
      console.log('Clearing Bandsintown API cache...');
      await EnhancedBandsintownDiscoveryClient.clearCache();
      
      // Perform the search - get current venueId to ensure we're using the latest selection
      const currentVenueId = activeVenue.id;
      console.log(`Using venueId ${currentVenueId} (${activeVenue.name}) for discovery search`);
      
      const response = await EnhancedBandsintownDiscoveryClient.findBandsNearVenue({
        venueId: currentVenueId,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        radius,
        maxBands: maxResults,
        lookAheadDays,
        useDemoMode: false, // No need to use the client-side demo mode now
        onIncrementalResults: handleIncrementalResults,
      });
      
      console.log(`Discovery search complete. Found ${response.data?.length || 0} results`);
      
      if (!response.data) {
        throw new Error('Invalid response from discovery API - missing data array');
      }
      
      // Final results update
      setSearchResults(response.data);
      if (response.stats) {
        setSearchStats(response.stats);
      }
      
      if (response.data.length === 0) {
        setErrorMessage(
          "No artists found passing near your venue in this date range. This could be due to:\n\n" +
          "• Limited tour data for future dates (most tours are announced 3-6 months in advance)\n" +
          "• Few artists with shows booked on both sides of your venue location\n\n" +
          "Try expanding your search radius, extending your date range, or checking back later as more artists announce tours."
        );
      }
      
      // Show total results in toast
      toast({
        title: "Search Complete",
        description: `Found ${response.data.length} bands passing near ${activeVenue.name}`,
      });
      
    } catch (error) {
      console.error("Error searching for bands:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "An unknown error occurred while searching for bands";
        
      setErrorMessage(`Search failed: ${errorMessage}. Please try reducing your search parameters or try again later.`);
      
      toast({
        title: "Search Error",
        description: "Failed to complete the band search. See error message for details.",
        variant: "destructive",
      });
      setIsLoading(false);
    } finally {
      if (!useDemoMode) {
        setIsLoading(false);
      }
    }
  };

  // Note: handleViewArtist function is already defined above

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">
        Enhanced Band Discovery
        <Badge variant="outline" className="ml-3 bg-purple-100">
          V2
        </Badge>
      </h1>
      
      <Alert className="mb-6 bg-blue-50">
        <Info className="h-4 w-4" />
        <AlertTitle>Venue Route Intelligence</AlertTitle>
        <AlertDescription>
          This enhanced discovery tool identifies bands with shows already booked in cities near your venue.
          The algorithm looks for bands with tour gaps between their scheduled shows when they'll be passing near your location.
        </AlertDescription>
      </Alert>
      
      {!activeVenue && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No venue selected</AlertTitle>
          <AlertDescription>
            Please select a venue from the sidebar to start discovering artists.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Date Range</CardTitle>
            <CardDescription>
              Select the dates you have available for booking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <DatePicker date={startDate} setDate={setStartDate} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <DatePicker date={endDate} setDate={setEndDate} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Search Options</CardTitle>
            <CardDescription>
              Configure the discovery parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="radius">Search Radius: {radius} miles</Label>
              </div>
              <Slider 
                id="radius"
                min={25} 
                max={300} 
                step={25} 
                value={[radius]} 
                onValueChange={(value) => setRadius(value[0])} 
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="lookAhead">Look Ahead: {lookAheadDays} days</Label>
              </div>
              <Slider 
                id="lookAhead"
                min={30} 
                max={180} 
                step={30} 
                value={[lookAheadDays]} 
                onValueChange={(value) => setLookAheadDays(value[0])} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maxResults">Maximum Results</Label>
              <Select 
                value={maxResults.toString()} 
                onValueChange={(value) => setMaxResults(Number(value))}
              >
                <SelectTrigger id="maxResults">
                  <SelectValue placeholder="Select max results" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 bands</SelectItem>
                  <SelectItem value="20">20 bands</SelectItem>
                  <SelectItem value="50">50 bands</SelectItem>
                  <SelectItem value="100">100 bands</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Discovery Mode</CardTitle>
            <CardDescription>
              Configure your discovery approach
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <Label htmlFor="enhanced-mode" className="font-medium">
                  Enhanced Discovery
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  Larger artist pool, better routing algorithm
                </p>
              </div>
              <Switch
                id="enhanced-mode"
                checked={useEnhancedDiscovery}
                onCheckedChange={setUseEnhancedDiscovery}
              />
            </div>
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <Label htmlFor="demo-mode" className="font-medium">
                  Demo Mode
                </Label>
                <p className="text-sm text-gray-500 mt-1">
                  Show immediate sample results
                </p>
              </div>
              <Switch
                id="demo-mode"
                checked={useDemoMode}
                onCheckedChange={setUseDemoMode}
              />
            </div>
            
            <Button 
              onClick={handleSearch} 
              disabled={!activeVenue || isLoading} 
              className="w-full"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Discover Bands
                </>
              )}
            </Button>
            
            {searchStats && (
              <div className="text-xs text-gray-500 mt-2">
                <p>Queried {searchStats.artistsQueried} artists in {(searchStats.elapsedTimeMs / 1000).toFixed(1)}s</p>
                <p>Found {searchStats.artistsWithEvents} with upcoming events</p>
                <p>API cache: {searchStats.apiCacheStats.hits} hits, {searchStats.apiCacheStats.misses} misses</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {isLoading && (
        <div className="mb-6">
          <p className="text-sm text-gray-500 mb-2">
            Searching for bands passing near {activeVenue?.name}...
            <span className="ml-2 text-xs italic">
              This may take a minute or two as we analyze tour routes for hundreds of artists
            </span>
          </p>
          <Progress value={searchStats?.elapsedTimeMs ? 75 : 45} className="h-2" />
          {searchStats && (
            <p className="text-xs text-gray-500 mt-2">
              Processing {searchStats.artistsQueried} artists
              {searchStats.artistsWithEvents > 0 && ` • Found ${searchStats.artistsWithEvents} with upcoming events`}
              {searchStats.artistsPassingNear > 0 && ` • ${searchStats.artistsPassingNear} passing near your venue`}
            </p>
          )}
        </div>
      )}
      
      {errorMessage && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Search Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      {searchResults.length > 0 && (
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="map">Map View</TabsTrigger>
            {selectedArtist && <TabsTrigger value="details">Artist Details</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="list" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((artist) => {
                const fitInfo = getFitDescription(artist.route.routingScore);
                
                return (
                  <Card key={artist.name} className="overflow-hidden flex flex-col">
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={artist.image} 
                        alt={artist.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex justify-between items-center">
                        <span>{artist.name}</span>
                        <Badge className={fitInfo.color}>{fitInfo.text}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2 flex-grow">
                      <div className="text-sm mb-3">
                        <div className="flex items-center mb-1">
                          <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                          <span>
                            {artist.route.distanceToVenue} miles from {activeVenue?.name} 
                            {artist.route.detourDistance > 0 && ` (+${artist.route.detourDistance} mile detour)`}
                          </span>
                        </div>
                        <div className="flex items-center mb-1">
                          <CalendarDays className="h-4 w-4 mr-1 text-gray-400" />
                          <span>{getDaysDescription(artist.route.daysAvailable)}</span>
                        </div>
                        <div className="flex items-center">
                          <Music className="h-4 w-4 mr-1 text-gray-400" />
                          <span>{artist.upcomingEvents} upcoming shows</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        {generateRoutingDescription(artist.name, artist.route)}
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => {
                          console.log("Button clicked - viewing artist details", artist.name);
                          // First update selected artist
                          setSelectedArtist(artist);
                          // Then manually force the tab change after a small delay
                          setTimeout(() => {
                            const detailsTab = document.querySelector('button[value="details"]');
                            if (detailsTab) {
                              console.log("Found details tab, clicking it directly");
                              (detailsTab as HTMLElement).click();
                            } else {
                              console.log("Details tab not found");
                            }
                          }, 50);
                        }}
                      >
                        View Details
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
          
          <TabsContent value="map" className="mt-0">
            <Card>
              <CardContent className="p-1 h-[600px]">
                {activeVenue && (
                  <InteractiveMapView 
                    locations={[
                      // Venue location
                      {
                        lat: parseFloat(activeVenue.latitude),
                        lng: parseFloat(activeVenue.longitude),
                        name: activeVenue.name,
                        isVenue: true
                      },
                      // Flatten all artist tour locations with proper grouping
                      ...searchResults.flatMap(artist => {
                        // Each artist tour is a group
                        const tourLocations = [];
                        
                        // Add origin location if available - use precise venue coordinates from event
                        if (artist.route.origin && artist.route.origin.date) {
                          // Try to find the matching event to get precise venue coordinates
                          const originEvent = artist.events?.find(e => 
                            e.datetime.split('T')[0] === artist.route.origin?.date);
                            
                          // If we found matching event, use its venue coordinates
                          if (originEvent && originEvent.venue.latitude && originEvent.venue.longitude) {
                            tourLocations.push({
                              lat: parseFloat(originEvent.venue.latitude),
                              lng: parseFloat(originEvent.venue.longitude),
                              name: `${originEvent.venue.name}, ${artist.route.origin.city}, ${artist.route.origin.state}`,
                              tourId: artist.name, // Use band name as tourId
                              bandName: artist.name,
                              imageUrl: artist.image,
                              date: artist.route.origin.date
                            });
                          } else if (artist.route.origin.lat && artist.route.origin.lng) {
                            // Fallback to approximate coordinates if no event found
                            tourLocations.push({
                              lat: artist.route.origin.lat,
                              lng: artist.route.origin.lng,
                              name: `${artist.route.origin.city}, ${artist.route.origin.state}`,
                              tourId: artist.name, // Use band name as tourId
                              bandName: artist.name,
                              imageUrl: artist.image,
                              date: artist.route.origin.date
                            });
                          }
                        }
                        
                        // Add destination location if available - use precise venue coordinates from event
                        if (artist.route.destination && artist.route.destination.date) {
                          // Try to find the matching event to get precise venue coordinates
                          const destEvent = artist.events?.find(e => 
                            e.datetime.split('T')[0] === artist.route.destination?.date);
                            
                          // If we found matching event, use its venue coordinates
                          if (destEvent && destEvent.venue.latitude && destEvent.venue.longitude) {
                            tourLocations.push({
                              lat: parseFloat(destEvent.venue.latitude),
                              lng: parseFloat(destEvent.venue.longitude),
                              name: `${destEvent.venue.name}, ${artist.route.destination.city}, ${artist.route.destination.state}`,
                              tourId: artist.name, // Use band name as tourId
                              bandName: artist.name,
                              imageUrl: artist.image,
                              date: artist.route.destination.date
                            });
                          } else if (artist.route.destination.lat && artist.route.destination.lng) {
                            // Fallback to approximate coordinates if no event found
                            tourLocations.push({
                              lat: artist.route.destination.lat,
                              lng: artist.route.destination.lng,
                              name: `${artist.route.destination.city}, ${artist.route.destination.state}`,
                              tourId: artist.name, // Use band name as tourId
                              bandName: artist.name,
                              imageUrl: artist.image,
                              date: artist.route.destination.date
                            });
                          }
                        }
                        
                        // Add midpoint for potential venue (when selected a specific artist)
                        if (selectedArtist && selectedArtist.name === artist.name &&
                            artist.route.origin && artist.route.destination) {
                          // Calculate midpoint between origin and destination
                          const midpointLat = (artist.route.origin.lat + artist.route.destination.lat) / 2;
                          const midpointLng = (artist.route.origin.lng + artist.route.destination.lng) / 2;
                          
                          // Add venue's coordinates instead of midpoint if available
                          tourLocations.push({
                            lat: parseFloat(activeVenue.latitude),
                            lng: parseFloat(activeVenue.longitude),
                            name: `Potential show at ${activeVenue.name}`,
                            tourId: artist.name,
                            bandName: artist.name,
                            imageUrl: artist.image,
                            date: artist.route.origin ? new Date(new Date(artist.route.origin.date).getTime() + 
                                  (new Date(artist.route.destination.date).getTime() - 
                                   new Date(artist.route.origin.date).getTime()) / 2).toISOString().split('T')[0] : undefined
                          });
                        }
                        
                        return tourLocations;
                      })
                    ]}
                    center={{
                      lat: parseFloat(activeVenue.latitude),
                      lng: parseFloat(activeVenue.longitude)
                    }}
                    zoom={selectedArtist ? 5 : 4}
                    showPaths={true}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {selectedArtist && (
            <TabsContent value="details" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <Card>
                    <div className="h-64 overflow-hidden">
                      <img 
                        src={selectedArtist.image} 
                        alt={selectedArtist.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardHeader>
                      <CardTitle>{selectedArtist.name}</CardTitle>
                      <CardDescription>
                        {selectedArtist.genre || "Unknown Genre"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <h4 className="text-sm font-semibold mb-1">Upcoming Events</h4>
                          <p>{selectedArtist.upcomingEvents} scheduled shows</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-semibold mb-1">Distance to Venue</h4>
                          <p>{selectedArtist.route.distanceToVenue} miles from {activeVenue?.name}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-semibold mb-1">Detour Distance</h4>
                          <p>{getDetourDescription(selectedArtist.route.detourDistance)} ({selectedArtist.route.detourDistance} miles)</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-semibold mb-1">Days Available</h4>
                          <p>{getDaysDescription(selectedArtist.route.daysAvailable)}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-semibold mb-1">Routing Fit</h4>
                          <div>
                            <Badge className={getFitDescription(selectedArtist.route.routingScore).color}>
                              {getFitDescription(selectedArtist.route.routingScore).text}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col items-start">
                      <Button 
                        variant="outline" 
                        className="w-full mb-2"
                        onClick={() => window.open(selectedArtist.url, "_blank")}
                      >
                        View on Bandsintown
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
                
                <div className="md:col-span-2">
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Routing Information</CardTitle>
                      <CardDescription>
                        How {selectedArtist.name} could fit your venue in their tour
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mt-2 mb-6">
                        <Alert className={`bg-opacity-20 ${getFitDescription(selectedArtist.route.routingScore).color.replace('text-', 'bg-')}`}>
                          <AlertTitle>{getFitDescription(selectedArtist.route.routingScore).text}</AlertTitle>
                          <AlertDescription>
                            {getFitDescription(selectedArtist.route.routingScore).description}
                          </AlertDescription>
                        </Alert>
                      </div>
                      
                      {/* Artist route map */}
                      <div className="h-[300px] mb-6 border rounded-md overflow-hidden">
                        {activeVenue && (
                          <InteractiveMapView 
                            locations={[
                              // Venue location
                              {
                                lat: parseFloat(activeVenue.latitude),
                                lng: parseFloat(activeVenue.longitude),
                                name: activeVenue.name,
                                isVenue: true
                              },
                              // Build a tour path with origin, venue, and destination
                              ...(selectedArtist.route.origin ? (() => {
                                // Try to find the matching event to get precise venue coordinates
                                const originEvent = selectedArtist.events?.find(e => 
                                  e.datetime.split('T')[0] === selectedArtist.route.origin?.date);
                                
                                if (originEvent && originEvent.venue.latitude && originEvent.venue.longitude) {
                                  return [{
                                    lat: parseFloat(originEvent.venue.latitude),
                                    lng: parseFloat(originEvent.venue.longitude),
                                    name: `${originEvent.venue.name}, ${selectedArtist.route.origin.city}, ${selectedArtist.route.origin.state}`,
                                    tourId: selectedArtist.name,
                                    bandName: selectedArtist.name,
                                    imageUrl: selectedArtist.image,
                                    date: selectedArtist.route.origin.date
                                  }];
                                } else if (selectedArtist.route.origin.lat && selectedArtist.route.origin.lng) {
                                  return [{
                                    lat: selectedArtist.route.origin.lat,
                                    lng: selectedArtist.route.origin.lng,
                                    name: `${selectedArtist.route.origin.city}, ${selectedArtist.route.origin.state}`,
                                    tourId: selectedArtist.name,
                                    bandName: selectedArtist.name,
                                    imageUrl: selectedArtist.image,
                                    date: selectedArtist.route.origin.date
                                  }];
                                }
                                return [];
                              })() : []),
                              // Add venue as potential stop on the tour
                              ...(selectedArtist.route.origin && selectedArtist.route.destination ? [{
                                lat: parseFloat(activeVenue.latitude),
                                lng: parseFloat(activeVenue.longitude),
                                name: `Potential show at ${activeVenue.name}`,
                                tourId: selectedArtist.name,
                                bandName: selectedArtist.name,
                                imageUrl: selectedArtist.image,
                                date: new Date(new Date(selectedArtist.route.origin.date).getTime() + 
                                      (new Date(selectedArtist.route.destination.date).getTime() - 
                                       new Date(selectedArtist.route.origin.date).getTime()) / 2).toISOString().split('T')[0]
                              }] : []),
                              // Destination
                              ...(selectedArtist.route.destination ? (() => {
                                // Try to find the matching event to get precise venue coordinates
                                const destEvent = selectedArtist.events?.find(e => 
                                  e.datetime.split('T')[0] === selectedArtist.route.destination?.date);
                                
                                if (destEvent && destEvent.venue.latitude && destEvent.venue.longitude) {
                                  return [{
                                    lat: parseFloat(destEvent.venue.latitude),
                                    lng: parseFloat(destEvent.venue.longitude),
                                    name: `${destEvent.venue.name}, ${selectedArtist.route.destination.city}, ${selectedArtist.route.destination.state}`,
                                    tourId: selectedArtist.name,
                                    bandName: selectedArtist.name,
                                    imageUrl: selectedArtist.image,
                                    date: selectedArtist.route.destination.date
                                  }];
                                } else if (selectedArtist.route.destination.lat && selectedArtist.route.destination.lng) {
                                  return [{
                                    lat: selectedArtist.route.destination.lat,
                                    lng: selectedArtist.route.destination.lng,
                                    name: `${selectedArtist.route.destination.city}, ${selectedArtist.route.destination.state}`,
                                    tourId: selectedArtist.name,
                                    bandName: selectedArtist.name,
                                    imageUrl: selectedArtist.image,
                                    date: selectedArtist.route.destination.date
                                  }];
                                }
                                return [];
                              })() : [])
                            ]}
                            zoom={5}
                            showPaths={true}
                          />
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        {selectedArtist.route.origin && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Previous Show</h4>
                            <div className="bg-gray-50 p-3 rounded-md">
                              <p className="font-medium">
                                {format(new Date(selectedArtist.route.origin.date), "EEEE, MMMM d, yyyy")}
                              </p>
                              <p className="text-gray-600">
                                {/* Try to find the venue name in the events */}
                                {selectedArtist.events?.find(e => 
                                  e.datetime.split('T')[0] === selectedArtist.route.origin?.date)?.venue.name || 'Unknown Venue'} 
                                in {selectedArtist.route.origin.city}, {selectedArtist.route.origin.state}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                {selectedArtist.route.distanceToVenue} miles from your venue
                              </p>
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <h4 className="text-sm font-semibold mb-2">Potential Show at Your Venue</h4>
                          <div className="bg-green-50 border border-green-200 p-3 rounded-md">
                            <p className="font-medium">
                              {selectedArtist.route.origin && selectedArtist.route.destination ? 
                                `${selectedArtist.route.daysAvailable} day window between shows` : 
                                'Potential show date (near other tour date)'}
                            </p>
                            <p className="text-gray-600">
                              {activeVenue?.name} - {activeVenue?.city}, {activeVenue?.state}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              Adding this venue would add {selectedArtist.route.detourDistance} miles to their journey
                            </p>
                          </div>
                        </div>
                        
                        {selectedArtist.route.destination && (
                          <div>
                            <h4 className="text-sm font-semibold mb-2">Next Show</h4>
                            <div className="bg-gray-50 p-3 rounded-md">
                              <p className="font-medium">
                                {format(new Date(selectedArtist.route.destination.date), "EEEE, MMMM d, yyyy")}
                              </p>
                              <p className="text-gray-600">
                                {/* Try to find the venue name in the events */}
                                {selectedArtist.events?.find(e => 
                                  e.datetime.split('T')[0] === selectedArtist.route.destination?.date)?.venue.name || 'Unknown Venue'} 
                                in {selectedArtist.route.destination.city}, {selectedArtist.route.destination.state}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Upcoming Shows</CardTitle>
                      <CardDescription>
                        All scheduled shows for {selectedArtist.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {selectedArtist.events.length === 0 ? (
                        <p className="text-gray-500">No upcoming shows scheduled.</p>
                      ) : (
                        <div className="space-y-2">
                          {selectedArtist.events.map((event, index) => (
                            <div key={event.id} className="flex justify-between py-2">
                              <div>
                                <p className="font-medium">
                                  {format(new Date(event.datetime), "MMM d, yyyy")}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {event.venue.name}, {event.venue.city}, {event.venue.region}
                                </p>
                              </div>
                              {index === 0 && <Badge variant="outline" className="h-fit">Next Show</Badge>}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  );
}