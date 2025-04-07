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

      const response = await fetch(`/api/bandsintown-discovery-v2/discover?${queryParams}`);

      if (!response.ok) {
        throw new Error('Discovery API request failed');
      }

      // If incremental results callback is provided, set up streaming response handling
      if (options.onIncrementalResults) {
        // Get a reader from the response body
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let allResults: DiscoveryResult[] = [];
        let buffer = '';
        let stats: DiscoveryStats | null = null;
        let venue: any = null;

        // Process the stream
        while (true) {
          const { value, done } = await reader.read();
          
          if (done) break;
          
          // Decode the chunk and add it to our buffer
          buffer += decoder.decode(value, { stream: true });
          
          // Process complete lines in the buffer
          const lines = buffer.split('\n');
          
          // Keep the last line in the buffer if it's incomplete
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (!line.trim()) continue; // Skip empty lines
            
            try {
              const data = JSON.parse(line);
              
              if (data.status === 'in-progress' && data.results) {
                // Call the incremental results callback with the new results
                options.onIncrementalResults(data.results);
                
                // Add to our accumulated results
                allResults = [...allResults, ...data.results];
              } else if (data.status === 'complete') {
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