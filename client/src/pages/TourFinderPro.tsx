import { useState, useEffect, useCallback } from "react";
import { useActiveVenue } from "../hooks/useActiveVenue";
import { useVenues } from "../hooks/useVenues";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnhancedBandsintownDiscoveryClient, DiscoveryResult, DiscoveryStats } from "@/services/bandsintown-discovery-v2";
import { EnhancedBandMapView } from "../components/maps/EnhancedBandMapView";
import { SimpleMapView } from "../components/maps/SimpleMapView";
import TourRouteVisualization from "./TourRouteVisualization";
import { 
  AlertCircle,
  PlusCircle, 
  CalendarDays, 
  Info, 
  MapPin, 
  AlertTriangle, 
  RefreshCw, 
  Music, 
  Zap, 
  Users, 
  Share2, 
  Clock, 
  Truck, 
  Filter, 
  Heart, 
  Search, 
  Mail, 
  ExternalLink,
  ArrowRightLeft,
  Building,
  Route
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { format, addDays, differenceInDays, parseISO } from "date-fns";
import { DatePicker } from "../components/DatePicker";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getFitDescription, generateRoutingDescription, getDaysDescription, getDetourDescription } from "@/lib/routing-utils";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function TourFinderPro() {
  // Use the venue property from context for consistency
  const { venue: activeVenue, venueId, setActiveVenueId } = useActiveVenue();
  const { data: venues } = useVenues();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<DiscoveryResult[]>([]);
  const [searchStats, setSearchStats] = useState<DiscoveryStats | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<DiscoveryResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState<string>("search");
  const [sortOrder, setSortOrder] = useState<string>("routing");
  const [filterGenre, setFilterGenre] = useState<string>("all");
  const [genreOptions, setGenreOptions] = useState<string[]>([]);
  
  // Search parameters - wider defaults for better results
  const today = new Date();
  const [startDate, setStartDate] = useState<Date>(today);
  const [endDate, setEndDate] = useState<Date>(addDays(today, 180));  // 6 months default
  const [radius, setRadius] = useState(200);  // 200 miles default
  const [maxResults, setMaxResults] = useState(30);
  const [lookAheadDays, setLookAheadDays] = useState(180);  // 6 months default
  const [useEnhancedDiscovery, setUseEnhancedDiscovery] = useState(true);
  const [useDemoMode, setUseDemoMode] = useState(false);
  
  // Generate unique genre list when results change
  useEffect(() => {
    if (searchResults && searchResults.length > 0) {
      const allGenres = new Set<string>();
      searchResults.forEach(artist => {
        if (artist.genre) {
          allGenres.add(artist.genre);
        }
      });
      setGenreOptions(Array.from(allGenres));
    }
  }, [searchResults]);
  
  // Handle venue selection change  
  const handleVenueChange = (venueId: string) => {
    // Set the active venue using the context
    setActiveVenueId(venueId);
    
    // Invalidate queries to refresh venue data
    queryClient.invalidateQueries({ queryKey: ['/api/venues-direct', venueId] });
    
    toast({
      title: "Venue Changed",
      description: `Selected venue is now ${venues?.find(v => v.id === venueId)?.name}`,
    });
  };
  
  // Reset when active venue changes 
  useEffect(() => {
    if (!venueId) return;
    
    // Clear results
    setSearchResults([]);
    setSelectedArtist(null);
    setErrorMessage(null);
    
    // Clear Bandsintown cache to ensure fresh results
    EnhancedBandsintownDiscoveryClient.clearCache()
      .then(result => {
        console.log("Cache cleared due to venue change:", result);
        
        // Invalidate any existing discovery queries
        queryClient.invalidateQueries({ queryKey: ['/api/bandsintown-discovery-v2'] });
        
        // Add a notification when venue changes
        if (activeVenue) {
          toast({
            title: "Venue Selected",
            description: `Selected venue is ${activeVenue.name}`
          });
        }
      })
      .catch(error => {
        console.error("Failed to clear cache after venue change:", error);
      });
  }, [activeVenue, venueId, toast, queryClient]);
  
  // Sorting and filtering functions
  const sortResults = useCallback((results: DiscoveryResult[]) => {
    if (!results) return [];
    
    let sorted = [...results];
    
    switch (sortOrder) {
      case "routing":
        sorted.sort((a, b) => a.route.routingScore - b.route.routingScore);
        break;
      case "distance":
        sorted.sort((a, b) => a.route.distanceToVenue - b.route.distanceToVenue);
        break;
      case "detour":
        sorted.sort((a, b) => a.route.detourDistance - b.route.detourDistance);
        break;
      case "days":
        sorted.sort((a, b) => b.route.daysAvailable - a.route.daysAvailable);
        break;
      case "alphabetical":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "draw":
        sorted.sort((a, b) => (b.drawSize || 0) - (a.drawSize || 0));
        break;
      default:
        // Default to routing score
        sorted.sort((a, b) => a.route.routingScore - b.route.routingScore);
    }
    
    // Apply genre filter if not "all"
    if (filterGenre !== "all") {
      sorted = sorted.filter(artist => artist.genre === filterGenre);
    }
    
    return sorted;
  }, [sortOrder, filterGenre]);
  
  // Update displayed results when sort or filter changes
  const displayedResults = sortResults(searchResults);
  
  // Handle incremental search results
  const handleViewArtist = (artist: DiscoveryResult) => {
    console.log("View artist details:", artist.name);
    setSelectedArtist(artist);
    setCurrentTab("details");
  };
  
  const handleIncrementalResults = (newResults: DiscoveryResult[]) => {
    if (!newResults || newResults.length === 0) return;
    
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
      return Array.from(existingResultsMap.values());
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
  
  // Import artist functionality
  const { mutate: importArtist, isPending: isImporting } = useMutation({
    mutationFn: async (artist: DiscoveryResult) => {
      if (!artist) throw new Error("No artist provided to import");
      
      const response = await fetch('/api/artists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: artist.name,
          genres: artist.genre ? [artist.genre] : [],
          imageUrl: artist.image,
          url: artist.url,
          website: artist.website || null,
          drawSize: artist.drawSize || null,
          // Optional fields based on route information
          location: artist.route.origin ? 
            `${artist.route.origin.city}, ${artist.route.origin.state}` : 
            null
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to import artist: ${response.statusText}`);
      }
      
      const data = await response.json();
      return { ...data, originalArtist: artist };
    },
    onSuccess: (data) => {
      toast({
        title: "Artist Imported Successfully",
        description: `${data.name} has been added to your collaboration database.`,
      });
      
      // Refresh artist list
      queryClient.invalidateQueries({ queryKey: ['/api/artists'] });
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  });
  
  // Handle search
  const handleSearch = async () => {
    if (!activeVenue) {
      toast({
        title: "No venue selected",
        description: "Please select a venue from the sidebar first to search for bands passing nearby.",
        variant: "destructive",
      });
      return;
    }

    // Log current venue to help with debugging
    console.log("Starting artist discovery search with venue:", activeVenue);

    setIsLoading(true);
    setErrorMessage(null);
    setSearchResults([]);
    setSelectedArtist(null);
    
    try {
      // Get the formatted date strings
      const formattedStartDate = format(startDate, "yyyy-MM-dd");
      const formattedEndDate = format(endDate, "yyyy-MM-dd");
      
      console.log(`Starting discovery search for venue ${venueId} from ${formattedStartDate} to ${formattedEndDate}`);
      
      if (useDemoMode) {
        // Use demo mode with a timeout to simulate search
        setTimeout(() => {
          toast({
            title: "Demo Mode Active",
            description: "Loading demo artist data instead of real API data."
          });
          
          fetch(`/api/bandsintown-discovery-v2/demo-data?venueId=${venueId}`)
            .then(response => {
              if (!response.ok) throw new Error("Failed to fetch demo data");
              return response.json();
            })
            .then(data => {
              setSearchResults(data.data || []);
              setSearchStats(data.stats || null);
              setIsLoading(false);
              
              if ((data.data || []).length === 0) {
                setErrorMessage("No demo results available. Try using the real API mode.");
              }
            })
            .catch(error => {
              console.error("Error fetching demo data:", error);
              setErrorMessage("Failed to load demo data. Try again or switch to API mode.");
              setIsLoading(false);
            });
        }, 1500);
        return;
      }
      
      // First check the API status
      const statusCheck = await EnhancedBandsintownDiscoveryClient.checkStatus();
      if (statusCheck.status !== 'ok') {
        throw new Error(`Bandsintown API status check failed: ${statusCheck.message || 'Unknown error'}`);
      }
      
      // Clear Bandsintown cache to ensure fresh results
      console.log('Clearing Bandsintown API cache before search...');
      await EnhancedBandsintownDiscoveryClient.clearCache();
      
      // Perform the search with the current venue ID
      console.log(`Using venueId ${venueId} (${activeVenue.name}) for discovery search`);
      
      const response = await EnhancedBandsintownDiscoveryClient.findBandsNearVenue({
        venueId: venueId as number,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        radius,
        maxBands: maxResults,
        lookAheadDays,
        useDemoMode: false,
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
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to format date with day of week
  const formatDateWithDay = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, "EEE, MMM d, yyyy");
    } catch (e) {
      return dateString;
    }
  };
  
  // Calculate availability window between two dates
  const getAvailabilityWindow = (origin: string, destination: string) => {
    try {
      const originDate = parseISO(origin);
      const destDate = parseISO(destination);
      const daysBetween = differenceInDays(destDate, originDate);
      return `${daysBetween} days (${format(originDate, "MMM d")} - ${format(destDate, "MMM d")})`;
    } catch (e) {
      return "Unknown";
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          Tour Finder
          <Badge variant="outline" className="ml-3 bg-purple-100">
            PRO
          </Badge>
        </h1>
        <p className="text-muted-foreground mt-1 max-w-xl">
          Find artists who will be touring near your venue and have gaps in their schedule. Connect with them for potential bookings.
        </p>
      </div>

      <Alert className="mb-6 bg-blue-50 border-blue-200">
        <Zap className="h-4 w-4 text-blue-600" />
        <AlertTitle>Intelligent Artist Discovery</AlertTitle>
        <AlertDescription>
          This tool analyzes touring patterns to identify artists who will be passing near your venue. 
          It finds bands with gaps in their tour schedule when they'll be in your area, 
          creating perfect opportunities for you to book them.
        </AlertDescription>
      </Alert>
      
      {!activeVenue && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Venue Selected</AlertTitle>
          <AlertDescription>
            Please select a venue from the dropdown menu in the sidebar to start discovering artists.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="search" value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Venue Setup
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2" disabled={searchResults.length === 0}>
            <Music className="h-4 w-4" />
            Artists 
            {searchResults.length > 0 && (
              <Badge variant="secondary" className="ml-1">{searchResults.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2" disabled={!selectedArtist}>
            <Info className="h-4 w-4" />
            Artist Details
          </TabsTrigger>
          <TabsTrigger value="map" className="flex items-center gap-2" disabled={searchResults.length === 0}>
            <Route className="h-4 w-4" />
            Tour Routes
          </TabsTrigger>
          <TabsTrigger value="tourvisualization" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Tour Visualization
          </TabsTrigger>
        </TabsList>
        
        {/* Venue Setup & Discovery Configuration Tab */}
        <TabsContent value="search">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Find Artists On Tour Near Your Venue</CardTitle>
                <CardDescription>
                  Discover artists with upcoming tours passing near your location
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="date-range">Venue Availability Window</Label>
                    <span className="text-xs text-muted-foreground">
                      {differenceInDays(endDate, startDate)} days
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground mb-1 block">Start Date</Label>
                      <DatePicker 
                        date={startDate} 
                        onDateChange={(date) => date && setStartDate(date)} 
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground mb-1 block">End Date</Label>
                      <DatePicker 
                        date={endDate} 
                        onDateChange={(date) => date && setEndDate(date)} 
                      />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="radius-slider">Search Radius: {radius} miles</Label>
                    </div>
                    <Slider 
                      id="radius-slider"
                      min={50} 
                      max={500} 
                      step={25} 
                      value={[radius]} 
                      onValueChange={(values) => setRadius(values[0])} 
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum distance from your venue to consider artists
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="lookahead-slider">Look-ahead Period: {lookAheadDays} days</Label>
                    </div>
                    <Slider 
                      id="lookahead-slider"
                      min={30} 
                      max={365} 
                      step={15} 
                      value={[lookAheadDays]} 
                      onValueChange={(values) => setLookAheadDays(values[0])} 
                    />
                    <p className="text-xs text-muted-foreground">
                      How far into the future to look for artist tour dates
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="results-slider">Maximum Results: {maxResults}</Label>
                    </div>
                    <Slider 
                      id="results-slider"
                      min={10} 
                      max={100} 
                      step={5} 
                      value={[maxResults]} 
                      onValueChange={(values) => setMaxResults(values[0])} 
                    />
                    <p className="text-xs text-muted-foreground">
                      Maximum number of artists to return in search results
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="demo-mode" 
                      checked={useDemoMode} 
                      onCheckedChange={setUseDemoMode} 
                    />
                    <Label htmlFor="demo-mode">Use Demo Mode</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Demo mode uses pre-generated data instead of making real API calls.
                            Useful for testing or when the API is unavailable.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="enhanced-mode" 
                      checked={useEnhancedDiscovery} 
                      onCheckedChange={setUseEnhancedDiscovery} 
                    />
                    <Label htmlFor="enhanced-mode">Enhanced Discovery</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Uses advanced routing algorithms to find better matches.
                            May take longer but produces higher quality results.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    // Reset to defaults
                    setStartDate(today);
                    setEndDate(addDays(today, 180));
                    setRadius(200);
                    setMaxResults(30);
                    setLookAheadDays(180);
                  }}
                >
                  Reset Settings
                </Button>
                <Button 
                  onClick={handleSearch} 
                  disabled={isLoading || !activeVenue}
                  className="min-w-[120px]"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Route className="mr-2 h-4 w-4" />
                      Find Artists On Tour
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="h-fit">
              <CardHeader>
                <CardTitle>Search Status</CardTitle>
                <CardDescription>
                  Search progress and statistics
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="space-y-4">
                    <p className="text-sm text-center text-muted-foreground">
                      Searching for artists...
                    </p>
                    <Progress value={45} className="w-full" />
                    <p className="text-xs text-center text-muted-foreground">
                      This may take a minute or two depending on your search criteria
                    </p>
                  </div>
                ) : searchStats ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Artists Analyzed:</span>
                      <span className="font-medium">{searchStats.artistsQueried}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Artists With Tours:</span>
                      <span className="font-medium">{searchStats.artistsWithEvents}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Matches Found:</span>
                      <span className="font-medium">{searchStats.artistsPassingNear}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total Events:</span>
                      <span className="font-medium">{searchStats.totalEventsFound}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-sm">Search Time:</span>
                      <span className="font-medium">{(searchStats.elapsedTimeMs / 1000).toFixed(1)}s</span>
                    </div>
                    
                    <div className="bg-muted p-3 rounded-md mt-2">
                      <p className="text-xs text-muted-foreground mb-1">API Cache Efficiency:</p>
                      <div className="flex justify-between text-xs">
                        <span>Cache Hits: {searchStats.apiCacheStats.hits}</span>
                        <span>Misses: {searchStats.apiCacheStats.misses}</span>
                      </div>
                    </div>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="text-center p-4">
                    <div className="text-3xl font-bold mb-1">{searchResults.length}</div>
                    <p className="text-sm text-muted-foreground">
                      Artists found passing near your venue
                    </p>
                  </div>
                ) : (
                  <div className="text-center p-4 space-y-2">
                    <Zap className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Configure your search parameters and click "Find Artists On Tour" to discover bands passing near your venue
                    </p>
                  </div>
                )}
                
                {errorMessage && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Search Error</AlertTitle>
                    <AlertDescription className="whitespace-pre-line text-xs">
                      {errorMessage}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
              
              <CardFooter className="flex justify-center">
                {searchResults.length > 0 && !isLoading && (
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentTab("results")}
                    className="w-full"
                  >
                    View Results
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        {/* Results Tab */}
        <TabsContent value="results">
          <div className="mb-6 flex flex-col md:flex-row justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-48">
                <Label htmlFor="sort-order" className="mb-1 block text-sm">Sort By</Label>
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger id="sort-order">
                    <SelectValue placeholder="Sort results" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="routing">Best Match</SelectItem>
                    <SelectItem value="distance">Distance</SelectItem>
                    <SelectItem value="detour">Smallest Detour</SelectItem>
                    <SelectItem value="days">Available Days</SelectItem>
                    <SelectItem value="alphabetical">Alphabetical</SelectItem>
                    <SelectItem value="draw">Audience Size</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {genreOptions.length > 0 && (
                <div className="w-full sm:w-48">
                  <Label htmlFor="filter-genre" className="mb-1 block text-sm">Filter Genre</Label>
                  <Select value={filterGenre} onValueChange={setFilterGenre}>
                    <SelectTrigger id="filter-genre">
                      <SelectValue placeholder="All genres" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Genres</SelectItem>
                      {genreOptions.map(genre => (
                        <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            <div className="flex items-end">
              <p className="text-sm text-muted-foreground">
                Showing {displayedResults.length} of {searchResults.length} artists
              </p>
            </div>
          </div>
          
          {displayedResults.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                No artists found matching your filters. Try adjusting your search criteria.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedResults.map((artist) => (
                <Card key={artist.name} className="overflow-hidden flex flex-col h-full">
                  <div className="aspect-video w-full bg-muted relative overflow-hidden">
                    {artist.image ? (
                      <img 
                        src={artist.image} 
                        alt={artist.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10">
                        <Music className="h-12 w-12 text-primary/50" />
                      </div>
                    )}
                    {artist.genre && (
                      <Badge className="absolute top-2 right-2">
                        {artist.genre}
                      </Badge>
                    )}
                  </div>
                  
                  <CardHeader className="p-4 pb-0">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl truncate">{artist.name}</CardTitle>
                      <div className="rounded-full bg-primary/10 h-10 w-10 flex items-center justify-center flex-shrink-0">
                        <span className="font-semibold text-primary text-xs">
                          {artist.route.routingScore}
                        </span>
                      </div>
                    </div>
                    <CardDescription className="mt-1">
                      {artist.drawSize ? (
                        <div className="flex items-center gap-1">
                          <Users size={14} className="text-muted-foreground" />
                          <span>Draw: {artist.drawSize}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">Upcoming events: {artist.upcomingEvents || "Unknown"}</span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="p-4 pt-2 flex-grow">
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin size={14} />
                        <span className="truncate">
                          {artist.route.distanceToVenue} miles from venue
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Truck size={14} />
                        <span className="truncate">
                          {getFitDescription(artist.route.detourDistance)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <CalendarDays size={14} />
                        <span className="truncate">
                          {getDaysDescription(artist.route.daysAvailable)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <Button variant="link" className="p-0 h-auto text-xs">
                            See routing details
                          </Button>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80">
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold">Touring Path</h4>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="rounded-sm h-auto">Origin</Badge>
                              <span className="text-sm">
                                {artist.route.origin ? `${artist.route.origin.city}, ${artist.route.origin.state}` : "Unknown"}
                                {artist.route.origin?.date && ` (${formatDateWithDay(artist.route.origin.date)})`}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="rounded-sm bg-primary/5 h-auto">Your Venue</Badge>
                              <ArrowRightLeft className="h-3 w-3 text-muted-foreground mx-1" />
                              <span className="text-sm">
                                {artist.route.distanceToVenue} miles away
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="rounded-sm h-auto">Destination</Badge>
                              <span className="text-sm">
                                {artist.route.destination ? `${artist.route.destination.city}, ${artist.route.destination.state}` : "Unknown"}
                                {artist.route.destination?.date && ` (${formatDateWithDay(artist.route.destination.date)})`}
                              </span>
                            </div>
                            
                            {artist.route.origin?.date && artist.route.destination?.date && (
                              <div className="pt-1">
                                <span className="text-xs text-muted-foreground">
                                  Available window: {getAvailabilityWindow(artist.route.origin.date, artist.route.destination.date)}
                                </span>
                              </div>
                            )}
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="p-4 pt-0 gap-2 mt-auto">
                    <Button 
                      onClick={() => handleViewArtist(artist)} 
                      variant="outline"
                      className="flex-1"
                    >
                      <Info className="h-4 w-4 mr-2" />
                      Details
                    </Button>
                    <Button 
                      onClick={() => importArtist(artist)} 
                      disabled={isImporting}
                      className="flex-1"
                    >
                      {isImporting ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Import
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Artist Details Tab */}
        <TabsContent value="details">
          {selectedArtist ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1 overflow-hidden">
                <div className="aspect-square w-full bg-muted relative">
                  {selectedArtist.image ? (
                    <img 
                      src={selectedArtist.image} 
                      alt={selectedArtist.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10">
                      <Music className="h-16 w-16 text-primary/50" />
                    </div>
                  )}
                </div>
                
                <CardHeader className="p-4 pb-0">
                  <CardTitle>{selectedArtist.name}</CardTitle>
                  <CardDescription>
                    {selectedArtist.genre || "Genre Unknown"}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="p-4 space-y-3">
                  {selectedArtist.drawSize && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>Typical audience: {selectedArtist.drawSize}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span>Upcoming events: {selectedArtist.upcomingEvents}</span>
                  </div>
                  
                  {selectedArtist.url && (
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={selectedArtist.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline truncate"
                      >
                        Bandsintown Profile
                      </a>
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="p-4 pt-0">
                  <Button 
                    onClick={() => importArtist(selectedArtist)} 
                    disabled={isImporting}
                    className="w-full"
                  >
                    {isImporting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Import to Database
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Tour Routing Analysis</CardTitle>
                  <CardDescription>
                    Analysis of how well this artist's tour route fits with your venue
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="p-4 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-muted p-4 rounded-lg text-center">
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Routing Score</h3>
                      <div className="text-3xl font-bold">{selectedArtist.route.routingScore}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Lower is better 
                      </p>
                    </div>
                    
                    <div className="bg-muted p-4 rounded-lg text-center">
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Distance</h3>
                      <div className="text-3xl font-bold">{selectedArtist.route.distanceToVenue}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Miles from venue
                      </p>
                    </div>
                    
                    <div className="bg-muted p-4 rounded-lg text-center">
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Available Days</h3>
                      <div className="text-3xl font-bold">{selectedArtist.route.daysAvailable}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Days between shows
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="text-md font-semibold">Tour Path</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="mt-0.5">Origin</Badge>
                        <div>
                          <p className="font-medium">
                            {selectedArtist.route.origin 
                              ? `${selectedArtist.route.origin.city}, ${selectedArtist.route.origin.state}` 
                              : "Unknown origin"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {selectedArtist.route.origin?.date 
                              ? formatDateWithDay(selectedArtist.route.origin.date)
                              : "Date unknown"}
                          </p>
                          {selectedArtist.events?.length > 0 && selectedArtist.events[0] && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Venue: {selectedArtist.events[0].venue.name}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="relative pl-12 py-2">
                        <div className="absolute left-4 top-0 bottom-0 w-px bg-muted"></div>
                        <div className="bg-primary/10 p-3 rounded-lg">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">Your Venue Window</span>
                            <Badge variant="secondary">
                              {selectedArtist.route.daysAvailable} days available
                            </Badge>
                          </div>
                          <p className="text-sm">
                            {activeVenue?.name || "Your venue"} is approximately {selectedArtist.route.distanceToVenue} miles 
                            from {selectedArtist.route.origin?.city || "their origin"}.
                          </p>
                          <p className="text-sm mt-1">
                            Adding your venue would create a {selectedArtist.route.detourDistance} mile detour in their route.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <Badge variant="outline" className="mt-0.5">Destination</Badge>
                        <div>
                          <p className="font-medium">
                            {selectedArtist.route.destination 
                              ? `${selectedArtist.route.destination.city}, ${selectedArtist.route.destination.state}` 
                              : "Unknown destination"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {selectedArtist.route.destination?.date 
                              ? formatDateWithDay(selectedArtist.route.destination.date)
                              : "Date unknown"}
                          </p>
                          {selectedArtist.events?.length > 1 && selectedArtist.events[1] && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Venue: {selectedArtist.events[1].venue.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="p-4 pt-0 flex flex-col sm:flex-row sm:justify-between gap-3">
                  <Button variant="outline" className="w-full sm:w-auto" onClick={() => setCurrentTab("map")}>
                    <MapPin className="h-4 w-4 mr-2" />
                    View on Map
                  </Button>
                  
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button className="flex-1" asChild>
                      <a 
                        href={`mailto:booking@example.com?subject=Booking Inquiry: ${selectedArtist.name}&body=I'd like to discuss booking ${selectedArtist.name} at ${activeVenue?.name || 'our venue'}.`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Contact
                      </a>
                    </Button>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline">
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold">Share Artist Info</h4>
                          <p className="text-sm text-muted-foreground">
                            Copy this information to share with your team
                          </p>
                          <div className="bg-muted p-2 rounded text-xs">
                            <p>Artist: {selectedArtist.name}</p>
                            <p>Genre: {selectedArtist.genre || "Unknown"}</p>
                            <p>Routing Score: {selectedArtist.route.routingScore}</p>
                            <p>Available Window: {selectedArtist.route.daysAvailable} days</p>
                            {selectedArtist.url && <p>More info: {selectedArtist.url}</p>}
                          </div>
                          <Button variant="secondary" className="w-full mt-2">
                            Copy to Clipboard
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </CardFooter>
              </Card>
              
              {/* Events List */}
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Upcoming Events</CardTitle>
                  <CardDescription>
                    Shows announced by this artist
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    {selectedArtist.events && selectedArtist.events.length > 0 ? (
                      <div className="space-y-3">
                        {selectedArtist.events.map((event, index) => (
                          <div key={event.id} className="flex items-start gap-4 p-3 hover:bg-muted rounded-lg">
                            <div className="flex-shrink-0 w-16 text-center">
                              <div className="text-xl font-bold">
                                {format(new Date(event.datetime), "d")}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {format(new Date(event.datetime), "MMM")}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {format(new Date(event.datetime), "yyyy")}
                              </div>
                            </div>
                            
                            <div className="flex-grow min-w-0">
                              <h4 className="font-medium truncate">{event.venue.name}</h4>
                              <p className="text-sm text-muted-foreground truncate">
                                {event.venue.city}, {event.venue.region}
                              </p>
                              
                              {index === 0 && selectedArtist.route?.origin && (
                                <Badge className="mt-1 bg-blue-100 text-blue-800 hover:bg-blue-200">Origin Show</Badge>
                              )}
                              
                              {index === selectedArtist.events.length - 1 && selectedArtist.route?.destination && (
                                <Badge className="mt-1 bg-purple-100 text-purple-800 hover:bg-purple-200">Destination Show</Badge>
                              )}
                            </div>
                            
                            <div className="flex-shrink-0 flex flex-col items-end">
                              <div className="text-sm">
                                {format(new Date(event.datetime), "h:mm a")}
                              </div>
                              
                              <div className="text-xs text-muted-foreground mt-1">
                                {format(new Date(event.datetime), "EEEE")}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">No events found for this artist</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="p-8 text-center">
              <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                Select an artist from the results to view their details
              </p>
              <Button 
                variant="link" 
                onClick={() => setCurrentTab("results")}
                className="mt-2"
              >
                Go to results
              </Button>
            </Card>
          )}
        </TabsContent>
        
        {/* Map View Tab */}
        <TabsContent value="map">
          {searchResults.length > 0 ? (
            <div className="space-y-6">
              <Card>
                <CardHeader className="p-4">
                  <CardTitle>Artist Tour Map</CardTitle>
                  <CardDescription>
                    Visualize artist tours in relation to your venue
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="p-0 pt-0">
                  <div className="h-[600px] relative">
                    <EnhancedBandMapView
                      venue={activeVenue}
                      artists={
                        selectedArtist 
                          ? [selectedArtist] 
                          : displayedResults.slice(0, 5)
                      }
                      onArtistSelect={handleViewArtist}
                    />
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {selectedArtist 
                    ? "Showing selected artist's tour path" 
                    : "Showing top 5 artists (select an artist to focus)"}
                </p>
                
                {selectedArtist && (
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedArtist(null)}
                  >
                    Show All Top Artists
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <Card className="p-8 text-center">
              <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                No artist data to display on the map. Run a search first.
              </p>
              <Button 
                variant="link" 
                onClick={() => setCurrentTab("search")}
                className="mt-2"
              >
                Go to search
              </Button>
            </Card>
          )}
        </TabsContent>
        
        {/* Tour Visualization Tab */}
        <TabsContent value="tourvisualization">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tour Route Visualization</CardTitle>
                <CardDescription>
                  Visualize tour routes and see how bands are traveling between venues
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TourRouteVisualization />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}