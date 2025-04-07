/**
 * Enhanced Bandsintown Discovery Client for Frontend
 * This provides access to the improved v2 discovery service that leverages
 * the Bandsintown API to find artists passing near a venue with improved
 * routing intelligence.
 */

export interface ArtistRoute {
  origin: {
    city: string;
    state: string;
    date: string;
    lat: number;
    lng: number;
  } | null;
  destination: {
    city: string;
    state: string;
    date: string;
    lat: number;
    lng: number;
  } | null;
  distanceToVenue: number;
  detourDistance: number;
  daysAvailable: number;
  routingScore: number;
}

export interface DiscoveryResult {
  name: string;
  image: string;
  url: string;
  upcomingEvents: number;
  route: ArtistRoute;
  events: Array<{
    id: string;
    datetime: string;
    venue: {
      name: string;
      city: string;
      region: string;
      country: string;
      latitude: string;
      longitude: string;
    };
  }>;
  genre?: string;
  bandsintownId?: string;
  drawSize?: number;
  website?: string;
}

export interface DiscoveryStats {
  artistsQueried: number;
  artistsWithEvents: number;
  artistsPassingNear: number;
  totalEventsFound: number;
  elapsedTimeMs: number;
  apiCacheStats: {
    keys: number;
    hits: number;
    misses: number;
  };
}

export interface DiscoveryResponse {
  data: DiscoveryResult[];
  venue: {
    id: number;
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    latitude: string;
    longitude: string;
  };
  stats: DiscoveryStats;
}

/**
 * Enhanced Bandsintown Discovery Service Client
 * This provides access to the improved v2 discovery service
 */
export class EnhancedBandsintownDiscoveryClient {
  /**
   * Check the status of the Bandsintown API connection
   */
  static async checkStatus(): Promise<{
    status: string;
    message: string;
    apiKey: boolean;
    apiResponse?: any;
  }> {
    try {
      const response = await fetch('/api/bandsintown-discovery-v2/status');

      if (!response.ok) {
        throw new Error('API status check failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to check Bandsintown API status', error);
      return { 
        status: 'error',
        message: 'Failed to connect to Bandsintown API service',
        apiKey: false
      };
    }
  }

  /**
   * Find bands that will be near a venue in a given date range
   */
  static async findBandsNearVenue(options: {
    venueId: number;
    startDate: string;
    endDate: string;
    radius?: number;
    maxBands?: number;
    lookAheadDays?: number;
    useDemoMode?: boolean;
    onIncrementalResults?: (newResults: DiscoveryResult[]) => void;
  }): Promise<DiscoveryResponse> {
    try {
      console.log("Starting discovery with options:", {
        venueId: options.venueId,
        startDate: options.startDate,
        endDate: options.endDate,
        radius: options.radius || 100,
        maxBands: options.maxBands || 20,
        streaming: !!options.onIncrementalResults
      });
      
      const queryParams = new URLSearchParams({
        venueId: options.venueId.toString(),
        startDate: options.startDate,
        endDate: options.endDate,
        radius: (options.radius || 100).toString(),
        maxBands: (options.maxBands || 20).toString(),
        lookAheadDays: (options.lookAheadDays || 90).toString(),
        useDemoMode: (options.useDemoMode || false).toString(),
        streaming: options.onIncrementalResults ? 'true' : 'false'
      });

      console.log("Fetching from:", `/api/bandsintown-discovery-v2/discover?${queryParams}`);
      const response = await fetch(`/api/bandsintown-discovery-v2/discover?${queryParams}`);

      if (!response.ok) {
        throw new Error(`Discovery API request failed with status ${response.status}`);
      }

      // If incremental results callback is provided, set up streaming response handling
      if (options.onIncrementalResults) {
        console.log("Setting up streaming response handling");
        
        // This is our simple approach - just create a fake result for testing
        if (options.useDemoMode) {
          console.log("Using demo mode, generating fake incremental results");
          setTimeout(() => {
            const demoResult: DiscoveryResult = {
              name: "Demo Band 1",
              image: "https://picsum.photos/200/300",
              url: "https://bandsintown.com",
              upcomingEvents: 5,
              route: {
                origin: {
                  city: "New York",
                  state: "NY",
                  date: "2025-05-01",
                  lat: 40.7128,
                  lng: -74.0060
                },
                destination: {
                  city: "Los Angeles",
                  state: "CA",
                  date: "2025-05-15",
                  lat: 34.0522,
                  lng: -118.2437
                },
                distanceToVenue: 100,
                detourDistance: 20,
                daysAvailable: 3,
                routingScore: 50
              },
              events: [],
              genre: "Rock"
            };
            options.onIncrementalResults!([demoResult]);
          }, 2000);
          
          // Return full response after some time
          return {
            data: [],
            stats: {
              artistsQueried: 100,
              artistsWithEvents: 50,
              artistsPassingNear: 1,
              totalEventsFound: 150,
              elapsedTimeMs: 5000,
              apiCacheStats: { keys: 100, hits: 50, misses: 50 }
            },
            venue: { 
              id: options.venueId, 
              name: 'Demo Venue', 
              address: '123 Main St', 
              city: 'Demoville', 
              state: 'DM', 
              zipCode: '12345', 
              latitude: '40.7128', 
              longitude: '-74.0060' 
            }
          };
        }
        
        // Get a reader from the response body
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let allResults: DiscoveryResult[] = [];
        let buffer = '';
        let stats: DiscoveryStats | null = null;
        let venue: any = null;

        console.log("Starting to read stream");
        // Process the stream
        while (true) {
          const { value, done } = await reader.read();
          
          if (done) {
            console.log("Stream reading complete");
            break;
          }
          
          // Decode the chunk and add it to our buffer
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          console.log("Received chunk:", chunk);
          
          // Process complete lines in the buffer
          const lines = buffer.split('\n');
          
          // Keep the last line in the buffer if it's incomplete
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (!line.trim()) continue; // Skip empty lines
            
            try {
              console.log("Processing line:", line);
              const data = JSON.parse(line);
              console.log("Parsed data:", data);
              
              if (data.status === 'in-progress' && data.results) {
                console.log("Got in-progress results:", data.results.length);
                // Call the incremental results callback with the new results
                options.onIncrementalResults(data.results);
                
                // Add to our accumulated results
                allResults = [...allResults, ...data.results];
              } else if (data.status === 'complete') {
                console.log("Got complete results");
                // Final complete result set
                if (data.results) {
                  allResults = data.results;
                }
                if (data.stats) {
                  stats = data.stats;
                }
                if (data.venue) {
                  venue = data.venue;
                }
              }
            } catch (err) {
              console.error('Error parsing streaming response:', err, 'Line:', line);
            }
          }
        }
        
        // Return the final accumulated result
        console.log("Returning final result:", allResults.length, "artists");
        return {
          data: allResults,
          stats: stats || {
            artistsQueried: 0,
            artistsWithEvents: 0,
            artistsPassingNear: 0,
            totalEventsFound: 0,
            elapsedTimeMs: 0,
            apiCacheStats: { keys: 0, hits: 0, misses: 0 }
          },
          venue: venue || { id: options.venueId, name: '', address: '', city: '', state: '', zipCode: '', latitude: '0', longitude: '0' }
        };
      }
      
      // For non-streaming requests, just return the JSON response
      console.log("Non-streaming request, returning JSON response");
      return await response.json();
    } catch (error) {
      console.error('Failed to perform band discovery:', error);
      throw error;
    }
  }

  /**
   * Clear the API request cache
   */
  static async clearCache(): Promise<{ status: string; message: string }> {
    try {
      const response = await fetch('/api/bandsintown-discovery-v2/clear-cache', {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to clear API cache');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to clear API cache:', error);
      return {
        status: 'error',
        message: 'Failed to clear API cache'
      };
    }
  }
}