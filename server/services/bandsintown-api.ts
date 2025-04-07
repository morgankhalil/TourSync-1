
import axios from 'axios';
import rateLimit from 'express-rate-limit';
import NodeCache from 'node-cache';

// Cache configuration
const API_CACHE = new NodeCache({
  stdTTL: 3600, // 1 hour standard TTL
  checkperiod: 120,
  useClones: false,
  maxKeys: 1000 // Limit cache size
});

// Cache keys
const CACHE_KEYS = {
  ARTIST: (name: string) => `artist:${name}`,
  EVENTS: (name: string) => `events:${name}`,
  SIMILAR: (name: string) => `similar:${name}`
};

export interface Artist {
  id: string;
  name: string;
  url: string;
  image_url: string;
  thumb_url: string;
  facebook_page_url: string;
  mbid: string;
  tracker_count: number;
  upcoming_event_count: number;
}

export interface Event {
  id: string;
  url: string;
  datetime: string;
  title: string;
  description?: string;
  venue: {
    name: string;
    location: string;
    city: string;
    region: string;
    country: string;
    latitude: string;
    longitude: string;
  };
  lineup: string[];
  offers: Array<{
    type: string;
    url: string;
    status: string;
  }>;
}

export interface ArtistWithEvents extends Artist {
  events: Event[];
}

export class BandsintownApiService {
  private apiKey: string;
  private baseUrl = 'https://rest.bandsintown.com/v4';
  private limiter: any;
  private statsCollector = {
    totalRequests: 0,
    cacheHits: 0,
    apiErrors: 0,
    artistsQueried: 0,
    eventsFound: 0,
  };

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    });
  }

  private async makeRequest<T>(endpoint: string, cacheKey: string): Promise<T> {
    this.statsCollector.totalRequests++;
    const cachedData = API_CACHE.get<T>(cacheKey);
    if (cachedData) {
      this.statsCollector.cacheHits++;
      return cachedData;
    }

    let retries = 0;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000;

    while (true) {
      try {
        const response = await axios.get(`${this.baseUrl}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          },
          timeout: 5000
        });
        API_CACHE.set(cacheKey, response.data);
        return response.data;
      } catch (error: any) {
        if (error.response?.status === 404) {
          this.statsCollector.apiErrors++;
          console.log(`Resource not found (404): ${endpoint}`);
          const emptyResult = [] as unknown as T;
          API_CACHE.set(cacheKey, emptyResult);
          return emptyResult;
        }
        if (retries >= MAX_RETRIES) {
          this.statsCollector.apiErrors++;
          console.error(`API request failed after ${MAX_RETRIES} retries:`, endpoint, error);
          throw error;
        }
        retries++;
        let delay = RETRY_DELAY * Math.pow(2, retries);
        console.log(`Waiting ${delay / 1000}s before retry ${retries}/${MAX_RETRIES}: ${endpoint}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        console.log(`Retrying request (${retries}/${MAX_RETRIES}): ${endpoint}`);
      }
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      await this.makeRequest('/artists/validate', 'apikey_validation');
      return true;
    } catch (error) {
      return false;
    }
  }

  resetStats() {
    this.statsCollector = {
      totalRequests: 0,
      cacheHits: 0,
      apiErrors: 0,
      artistsQueried: 0,
      eventsFound: 0,
    };
  }

  getStats() {
    return { ...this.statsCollector };
  }

  async getArtistEvents(artistName: string): Promise<Event[]> {
    const endpoint = `/artists/${encodeURIComponent(artistName)}/events`;
    const cacheKey = CACHE_KEYS.EVENTS(artistName);
    return this.makeRequest(endpoint, cacheKey);
  }

  async getVenueEvents(venueId: string): Promise<Event[]> {
    const endpoint = `/venues/${venueId}/events`;
    const cacheKey = `venue_events:${venueId}`;
    return this.makeRequest(endpoint, cacheKey);
  }

  async getArtist(artistName: string): Promise<Artist> {
    const endpoint = `/artists/${encodeURIComponent(artistName)}`;
    const cacheKey = CACHE_KEYS.ARTIST(artistName);
    return this.makeRequest(endpoint, cacheKey);
  }

  async getMultipleArtistsWithEvents(
    artistNames: string[],
    startDate: string,
    endDate: string,
    onProgress?: (completed: number, total: number) => void
  ): Promise<ArtistWithEvents[]> {
    this.statsCollector.artistsQueried = artistNames.length;
    const results: ArtistWithEvents[] = [];
    let completed = 0;

    // Process artists in batches of 3 to avoid rate limiting
    const batchSize = 3;
    for (let i = 0; i < artistNames.length; i += batchSize) {
      const batch = artistNames.slice(i, i + batchSize);
      const batchPromises = batch.map(async (artistName) => {
        try {
          const artist = await this.getArtist(artistName);
          if (!artist) return null;

          const events = await this.getArtistEvents(artistName);
          this.statsCollector.eventsFound += events.length;

          completed++;
          if (onProgress) {
            onProgress(completed, artistNames.length);
          }

          return {
            ...artist,
            events: events.filter(event => {
              const eventDate = new Date(event.datetime);
              return eventDate >= new Date(startDate) && eventDate <= new Date(endDate);
            })
          };
        } catch (error) {
          console.error(`Error fetching data for artist ${artistName}:`, error);
          completed++;
          if (onProgress) {
            onProgress(completed, artistNames.length);
          }
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter((r): r is ArtistWithEvents => r !== null));

      // Add a small delay between batches to avoid rate limiting
      if (i + batchSize < artistNames.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  clearCache(): void {
    API_CACHE.flushAll();
    console.log('API cache cleared');
  }

  getCacheStats(): { keys: number, hits: number, misses: number } {
    return {
      keys: API_CACHE.keys().length,
      hits: API_CACHE.getStats().hits,
      misses: API_CACHE.getStats().misses
    };
  }
}
