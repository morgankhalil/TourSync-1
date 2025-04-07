import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useActiveVenue } from '@/hooks/useActiveVenue';
import { useToast } from '@/hooks/use-toast';
import { BandDiscoveryResult, BandPassingNearby, DiscoveryResult, Venue } from '@/types';
import { getLocationLabel, formatDate, formatDateMedium, calculateDistance, getFitDescription } from '@/lib/utils';
import { bandsintownService } from '@/services/bandsintown';
import { bandsintownDiscoveryService } from '@/services/bandsintown-discovery';
import BandMapView from '@/components/maps/BandMapView';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const ArtistDiscovery: React.FC = () => {
  const venue = useActiveVenue();
  const activeVenue = venue.activeVenue;
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  ); // Default to 1 week from now
  const [endDate, setEndDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  ); // Default to 1 month from now
  const [radius, setRadius] = useState<number>(50);
  const [selectedBand, setSelectedBand] = useState<BandPassingNearby | null>(null);
  const [useDemoMode, setUseDemoMode] = useState<boolean>(true);

  // Query to find bands near the active venue using real-time Bandsintown API
  const { data: bandsNearVenue, isLoading, error, refetch } = useQuery({
    // Include useDemoMode in queryKey to trigger refetch when it changes
    queryKey: activeVenue ? ['discover-bands-near-venue', activeVenue.id, startDate, endDate, radius, useDemoMode] : ['skip-query'],
    queryFn: async () => {
      if (!activeVenue) {
        throw new Error('Please select a venue first');
      }
      if (!activeVenue.latitude || !activeVenue.longitude) {
        throw new Error(`Venue "${activeVenue.name}" is missing location data. Please update the venue coordinates in venue settings.`);
      }
      
      // Log the current mode for debugging
      console.log(`Searching for bands with demo mode ${useDemoMode ? 'ENABLED' : 'DISABLED'}`);
      
      // Use the direct discovery service that polls Bandsintown API in real-time
      // If useDemoMode is true, force use of sample data instead of API
      const results = await bandsintownDiscoveryService.findBandsNearVenue({
        venueId: activeVenue.id,
        startDate,
        endDate,
        radius,
        useDemo: useDemoMode
      });
      
      // Make sure results is an array before mapping
      if (!Array.isArray(results)) {
        console.error('Expected array of results but got:', results);
        return [];
      }
      
      // Convert to BandPassingNearby format for the UI
      return results.map(result => ({
        band: {
          id: Math.random(), // Temporary ID for UI purposes
          name: result.name,
          contactEmail: '',
          contactPhone: null,
          description: null,
          genre: null,
          social: {}, // Add missing required property
          drawSize: null,
          pastVenues: {},
          technicalRequirements: {},
          imageUrl: result.image,
          videoUrl: null,
          preferredVenueTypes: {},
          // Extended properties
          location: '',
          website: result.url,
          bandsintownId: result.url.split('/').pop()
        },
        route: result.route
      }));
    },
    enabled: !!activeVenue,
    retry: false, // Don't retry on error since it's likely a data issue
    refetchOnWindowFocus: false
  });

  // Function to check Bandsintown API status
  const checkApiStatus = async () => {
    if (!activeVenue) {
      toast({
        title: 'No venue selected',
        description: 'Please select a venue to find bands nearby.',
        variant: 'destructive',
      });
      return;
    }

    try {
      toast({
        title: 'Checking Bandsintown API',
        description: 'Verifying connection...',
      });

      const status = await bandsintownDiscoveryService.checkStatus();

      if (status.apiKeyConfigured && status.discoveryEnabled) {
        toast({
          title: 'Bandsintown API Ready',
          description: 'API connection successful. You can now search for artists.',
        });
      } else {
        toast({
          title: 'Bandsintown API Issue',
          description: status.apiKeyConfigured 
            ? 'Discovery feature is disabled.' 
            : 'API key is not configured. Please contact support.',
          variant: 'destructive',
        });
        
        // If API key is not configured, automatically enable demo mode
        if (!status.apiKeyConfigured && !useDemoMode) {
          setUseDemoMode(true);
          toast({
            title: 'Demo Mode Enabled',
            description: 'Switched to demo mode due to API configuration issues.',
          });
        }
      }
    } catch (error) {
      toast({
        title: 'API Connection Error',
        description: error instanceof Error ? error.message : 'Could not connect to Bandsintown API.',
        variant: 'destructive',
      });
      
      // Automatically enable demo mode on connection error
      if (!useDemoMode) {
        setUseDemoMode(true);
        toast({
          title: 'Demo Mode Enabled',
          description: 'Switched to demo mode due to API connection issues.',
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Artist Discovery</h1>
          <p className="text-muted-foreground">
            Find bands that are already on tour and passing near your venue using live Bandsintown data.
          </p>
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={checkApiStatus}>
            Check API Status
          </Button>
          <Button onClick={() => refetch()}>Find Bands Nearby</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Criteria</CardTitle>
          <CardDescription>
            Set the date range and proximity to find bands touring near your venue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label htmlFor="startDate" className="text-sm font-medium">
                Start Date
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 border rounded"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="endDate" className="text-sm font-medium">
                End Date
              </label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 border rounded"
                min={startDate}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="radius" className="text-sm font-medium">
                Search Radius (miles)
              </label>
              <input
                id="radius"
                type="range"
                min="10"
                max="200"
                step="10"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-sm text-right">{radius} miles</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 mt-4">
            <Switch 
              id="demo-mode" 
              checked={useDemoMode} 
              onCheckedChange={setUseDemoMode}
            />
            <Label htmlFor="demo-mode">Use demo data {useDemoMode ? "(Enabled)" : "(Disabled)"}</Label>
            <div className="ml-2 text-sm text-muted-foreground">
              {useDemoMode 
                ? "Using sample data for demonstration purposes" 
                : "Using live Bandsintown API data"}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            {useDemoMode && (
              <div className="flex items-center text-amber-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-info mr-1"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                Demo mode is active. Results are simulated.
              </div>
            )}
          </div>
          <Button onClick={() => refetch()}>Search</Button>
        </CardFooter>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bands Passing Nearby</CardTitle>
              <CardDescription>
                {bandsNearVenue && bandsNearVenue.length > 0
                  ? `Found ${bandsNearVenue.length} bands passing near ${activeVenue?.name || 'your venue'}`
                  : 'No bands found'}
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-[500px] overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-4">Loading...</div>
              ) : error ? (
                <div className="text-center py-4 text-red-500">
                  Error loading bands: {error instanceof Error ? error.message : 'Unknown error'}
                </div>
              ) : bandsNearVenue && bandsNearVenue.length > 0 ? (
                <div className="space-y-3">
                  {bandsNearVenue.map((result) => (
                    <div
                      key={result.band.id}
                      className={`p-3 rounded border cursor-pointer transition-colors ${
                        selectedBand?.band.id === result.band.id
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => setSelectedBand(result)}
                    >
                      <div className="font-medium">{result.band.name}</div>
                      <div className="text-sm text-muted-foreground">{result.band.genre}</div>
                      <div className="flex justify-between text-xs mt-2">
                        <span>
                          {result.route.origin && 
                           `${formatDate(result.route.origin.date, { month: 'short', day: 'numeric' })} ${result.route.origin.city}`}
                        </span>
                        {result.route.destination ? (
                          <>
                            <span>→</span>
                            <span>
                              {`${formatDate(result.route.destination.date, { month: 'short', day: 'numeric' })} ${result.route.destination.city}`}
                            </span>
                          </>
                        ) : (
                          <span className="text-green-500">Single show</span>
                        )}
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span>
                          <span className="text-green-600 font-medium">{result.route.distanceToVenue} miles</span> from your venue
                        </span>
                        <span>
                          {result.route.daysAvailable} {result.route.daysAvailable === 1 ? 'day' : 'days'} available
                        </span>
                      </div>
                      {result.route.routingScore !== undefined && (
                        <div className="flex items-center mt-1 text-xs">
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mr-2">
                            <div 
                              className="bg-green-500 h-1.5 rounded-full" 
                              style={{ width: `${Math.max(0, 100 - Math.min(100, result.route.routingScore/3))}%` }}
                            ></div>
                          </div>
                          <span className="text-muted-foreground">{getFitDescription(result.route.routingScore)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  {activeVenue ? (
                    <>
                      <p>No bands found passing near {activeVenue.name} in this date range.</p>
                      <p className="mt-2 text-sm">Try expanding your date range or search radius.</p>
                    </>
                  ) : (
                    <p>Select a venue to get started</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          {selectedBand ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{selectedBand.band.name}</CardTitle>
                    <CardDescription>
                      {selectedBand.band.genre || 'Genre unknown'} •{' '}
                      {selectedBand.band.location || 'Location unknown'}
                    </CardDescription>
                  </div>
                  <div className="space-x-2">
                    <Button variant="outline" size="sm">
                      Contact
                    </Button>
                    <Button size="sm">Book Now</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Tour Route</h3>
                  <div className="h-[300px] w-full rounded overflow-hidden border">
                    <BandMapView
                      band={selectedBand.band}
                      route={selectedBand.route}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Previous Show</div>
                    <div className="font-medium">
                      {selectedBand.route.origin
                        ? `${formatDate(selectedBand.route.origin.date, { month: 'short', day: 'numeric' })}`
                        : 'None'}
                    </div>
                    <div className="text-sm">
                      {selectedBand.route.origin
                        ? getLocationLabel(selectedBand.route.origin.city, selectedBand.route.origin.state)
                        : ''}
                    </div>
                  </div>

                  <div className="space-y-1 text-center">
                    <div className="text-sm text-muted-foreground">Gap</div>
                    <div className="font-medium text-xl">{selectedBand.route.daysAvailable} days</div>
                    <div className="text-sm text-muted-foreground">available</div>
                  </div>

                  <div className="space-y-1 text-right">
                    <div className="text-sm text-muted-foreground">Next Show</div>
                    <div className="font-medium">
                      {selectedBand.route.destination
                        ? `${formatDate(selectedBand.route.destination.date, { month: 'short', day: 'numeric' })}`
                        : 'None'}
                    </div>
                    <div className="text-sm">
                      {selectedBand.route.destination
                        ? getLocationLabel(selectedBand.route.destination.city, selectedBand.route.destination.state)
                        : ''}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2">Route Analysis</h3>
                    <ul className="space-y-1 text-sm">
                      <li className="flex justify-between">
                        <span>Distance to Venue:</span>
                        <span className="font-medium">{selectedBand.route.distanceToVenue} miles</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Detour Distance:</span>
                        <span className="font-medium">{selectedBand.route.detourDistance} miles</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Days Available:</span>
                        <span className="font-medium">{selectedBand.route.daysAvailable} days</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Band Details</h3>
                    <ul className="space-y-1 text-sm">
                      <li className="flex justify-between">
                        <span>Draw Size:</span>
                        <span className="font-medium">{selectedBand.band.drawSize || 'Unknown'}</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Website:</span>
                        <span className="font-medium">
                          {selectedBand.band.website ? (
                            <a href={selectedBand.band.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                              Visit
                            </a>
                          ) : (
                            'None'
                          )}
                        </span>
                      </li>
                      <li className="flex justify-between">
                        <span>Bandsintown:</span>
                        <span className="font-medium">
                          {selectedBand.band.bandsintownId ? (
                            <a
                              href={`https://www.bandsintown.com/a/${selectedBand.band.bandsintownId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              View
                            </a>
                          ) : (
                            'None'
                          )}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium mb-2">Select a band to view details</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Click on a band from the list to view their route, details, and booking options.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArtistDiscovery;