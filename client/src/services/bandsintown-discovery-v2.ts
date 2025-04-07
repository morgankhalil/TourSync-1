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
        useDemoMode: (options.useDemoMode || false).toString()
      });

      const response = await fetch(`/api/bandsintown-discovery-v2/discover?${queryParams}`);

      if (!response.ok) {
        throw new Error('Discovery API request failed');
      }

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