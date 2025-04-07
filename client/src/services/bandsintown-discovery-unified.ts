/**
 * Unified Bandsintown Discovery Client
 * This provides a clean interface to the consolidated Bandsintown discovery API,
 * combining the features of both v1 and v2 implementations.
 */

// Types for route analysis and discovery results
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

export interface ApiStatus {
  status: string;
  message: string;
  apiKeyConfigured: boolean;
  discoveryEnabled: boolean;
}

/**
 * Unified Bandsintown Discovery Service
 */
export class BandsintownDiscoveryClient {
  private static API_BASE = '/api/bandsintown-discovery';

  /**
   * Check the status of the Bandsintown API connection
   */
  static async checkStatus(): Promise<ApiStatus> {
    try {
      const response = await fetch(`${this.API_BASE}/status`);

      if (!response.ok) {
        throw new Error(`API status check failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to check Bandsintown API status', error);
      return {
        status: 'error',
        message: 'Failed to connect to Bandsintown API service',
        apiKeyConfigured: false,
        discoveryEnabled: false
      };
    }
  }

  /**
   * Clear the API request cache to refresh data
   */
  static async clearCache(): Promise<{ status: string; message: string }> {
    try {
      const response = await fetch(`${this.API_BASE}/clear-cache`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(`Clear cache request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to clear API cache', error);
      return {
        status: 'error',
        message: 'Failed to clear API cache'
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
    genres?: string[];
    maxBands?: number;
    maxDistance?: number;
    lookAheadDays?: number;
    useDemoMode?: boolean;
    onIncrementalResults?: (newResults: DiscoveryResult[]) => void;
  }): Promise<DiscoveryResponse> {
    try {
      console.log("Starting discovery with options:", {
        venueId: options.venueId,
        startDate: options.startDate,
        endDate: options.endDate,
        radius: options.radius || 50,
        maxBands: options.maxBands || 20,
        streaming: !!options.onIncrementalResults,
        useDemoMode: options.useDemoMode || false
      });

      // Build query parameters
      const queryParams = new URLSearchParams({
        venueId: options.venueId.toString(),
        startDate: options.startDate,
        endDate: options.endDate,
        radius: (options.radius || 50).toString(),
        maxBands: (options.maxBands || 20).toString(),
        lookAheadDays: (options.lookAheadDays || 90).toString(),
        useDemoMode: (options.useDemoMode || false).toString(),
        streaming: options.onIncrementalResults ? 'true' : 'false'
      });

      // Add genres if provided
      if (options.genres && options.genres.length > 0) {
        options.genres.forEach(genre => {
          queryParams.append('genres', genre);
        });
      }

      // Add maxDistance if provided
      if (options.maxDistance) {
        queryParams.append('maxDistance', options.maxDistance.toString());
      }

      const url = `${this.API_BASE}/discover?${queryParams}`;
      console.log("Fetching from:", url);
      
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Discovery API request failed with status ${response.status}`);
      }

      // Handle streaming responses if incremental results are requested
      if (options.onIncrementalResults) {
        // Create a response reader
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        
        if (!reader) {
          throw new Error('Failed to get response reader for streaming results');
        }
        
        let buffer = '';
        let finalResult: DiscoveryResponse | null = null;
        
        // Process streaming chunks
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            // End of stream
            break;
          }
          
          buffer += decoder.decode(value, { stream: true });
          
          // Process complete lines in the buffer
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep any incomplete line in the buffer
          
          for (const line of lines) {
            if (!line.trim()) continue;
            
            try {
              const data = JSON.parse(line);
              
              if (data.status === 'in-progress' && data.results) {
                // Process incremental results
                options.onIncrementalResults(data.results);
              } else if (data.status === 'complete') {
                // Store the final complete result
                finalResult = {
                  data: data.results || [],
                  venue: data.venue || { id: options.venueId },
                  stats: data.stats || { 
                    artistsQueried: 0, 
                    artistsWithEvents: 0, 
                    artistsPassingNear: 0, 
                    totalEventsFound: 0, 
                    elapsedTimeMs: 0, 
                    apiCacheStats: { keys: 0, hits: 0, misses: 0 } 
                  }
                };
              } else if (data.status === 'error') {
                console.error('Error in streaming response:', data.message);
              }
            } catch (err) {
              console.error('Error parsing streaming response line:', err, line);
            }
          }
        }
        
        // Return the final result or a default response
        if (finalResult) {
          return finalResult;
        }
      }

      // For non-streaming responses, just return the JSON directly
      return await response.json();
    } catch (error) {
      console.error('Error during band discovery:', error);
      
      // Return an empty response in case of error
      return {
        data: [],
        venue: {
          id: options.venueId,
          name: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          latitude: '',
          longitude: ''
        },
        stats: {
          artistsQueried: 0,
          artistsWithEvents: 0,
          artistsPassingNear: 0,
          totalEventsFound: 0,
          elapsedTimeMs: 0,
          apiCacheStats: { keys: 0, hits: 0, misses: 0 }
        }
      };
    }
  }
}