/**
 * Enhanced Bandsintown API Service
 * Features:
 * - Request caching to reduce redundant API calls
 * - Retry mechanisms for failed requests
 * - Batch processing to handle larger artist lists
 * - Error handling and logging
 */

import axios, { AxiosError, AxiosResponse } from 'axios';
import NodeCache from 'node-cache';

// Cache configuration
// stdTTL: Standard Time-To-Live in seconds for every generated cache element
// 3600 = 1 hour cache duration
const API_CACHE = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

// Constants
const API_BASE_URL = 'https://rest.bandsintown.com';
const MAX_RETRIES = 3; // Increased from 2 to allow more retries
const RETRY_DELAY = 1000; // 1 second base delay (will use exponential backoff)
const BATCH_SIZE = 3; // Reduced from 5 to 3 to be more conservative with API
const BATCH_DELAY = 3000; // Reduced from 5 seconds to 3 seconds between batches

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
  private statsCollector: {
    totalRequests: number;
    cacheHits: number;
    apiErrors: number;
    artistsQueried: number;
    eventsFound: number;
  } = {
    totalRequests: 0,
    cacheHits: 0,
    apiErrors: 0,
    artistsQueried: 0,
    eventsFound: 0,
  };

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    if (!this.apiKey) {
      console.warn("BandsintownApiService initialized without API key - API requests will fail");
    }
  }

  /**
   * Reset the stats collector
   */
  resetStats() {
    this.statsCollector = {
      totalRequests: 0,
      cacheHits: 0,
      apiErrors: 0,
      artistsQueried: 0,
      eventsFound: 0,
    };
  }

  /**
   * Get the current stats
   */
  getStats() {
    return { ...this.statsCollector };
  }

  /**
   * Make an API request with retry logic and caching
   */
  private async makeRequest<T>(
    endpoint: string,
    cacheKey: string,
    params: Record<string, string> = {}
  ): Promise<T> {
    this.statsCollector.totalRequests++;

    // Check cache first
    const cachedData = API_CACHE.get<T>(cacheKey);
    if (cachedData) {
      this.statsCollector.cacheHits++;
      return cachedData;
    }

    // Prepare the request URL
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Add the app_id parameter
    const fullParams = { ...params, app_id: this.apiKey };
    
    // Build the query string
    const queryString = Object.entries(fullParams)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    
    // Full URL with query string
    const fullUrl = `${url}?${queryString}`;

    // Make the request with retry logic
    let retries = 0;
    while (true) {
      try {
        const response = await axios.get<T>(fullUrl);
        
        // Cache the successful response
        API_CACHE.set(cacheKey, response.data);
        
        return response.data;
      } catch (error) {
        // Check if this is a 404 Not Found error (likely artist not found)
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          // For 404 errors, we'll log a gentler message and cache an empty result
          // to avoid repeatedly hitting the API for nonexistent artists
          this.statsCollector.apiErrors++;
          console.log(`Resource not found (404): ${endpoint}`);
          
          // For arrays, cache an empty array; otherwise throw
          if (Array.isArray(cachedData) || endpoint.includes('/events')) {
            const emptyResult = [] as unknown as T;
            API_CACHE.set(cacheKey, emptyResult);
            return emptyResult;
          }
          
          throw error;
        }
        
        if (retries >= MAX_RETRIES) {
          this.statsCollector.apiErrors++;
          console.error(`API request failed after ${MAX_RETRIES} retries:`, endpoint);
          
          if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            if (axiosError.response) {
              console.error(`Status: ${axiosError.response.status}`);
              console.error('Response data:', axiosError.response.data);
            } else if (axiosError.request) {
              console.error('No response received');
            } else {
              console.error('Error message:', axiosError.message);
            }
          } else {
            console.error('Unknown error:', error);
          }
          
          throw error;
        }
        
        // Increment retry counter
        retries++;
        
        // Implement exponential backoff
        const isRateLimitError = axios.isAxiosError(error) && 
          (error.response?.status === 429 || error.response?.status === 403);
        
        // Calculate delay - longer for rate limit errors (exponential), shorter for other errors (linear)
        let delay = isRateLimitError 
          ? RETRY_DELAY * Math.pow(3, retries) // Exponential backoff: 1s, 3s, 9s, 27s
          : RETRY_DELAY * retries;            // Linear backoff: 1s, 2s, 3s
        
        console.log(`${isRateLimitError ? 'Rate limit detected. Using exponential backoff.' : 'Using standard delay.'}`);
        console.log(`Waiting ${delay/1000}s before retry ${retries}/${MAX_RETRIES}: ${endpoint}`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        
        console.log(`Retrying request (${retries}/${MAX_RETRIES}): ${endpoint}`);
      }
    }
  }

  /**
   * Get an artist by name
   */
  async getArtist(name: string): Promise<Artist | null> {
    try {
      this.statsCollector.artistsQueried++;
      const endpoint = `/artists/${encodeURIComponent(name)}`;
      const cacheKey = CACHE_KEYS.ARTIST(name);
      
      return await this.makeRequest<Artist>(endpoint, cacheKey);
    } catch (error) {
      console.error(`Error fetching artist ${name}:`, error);
      return null;
    }
  }

  /**
   * Get events for an artist
   */
  async getArtistEvents(name: string, dateFrom?: string, dateTo?: string): Promise<Event[]> {
    try {
      const endpoint = `/artists/${encodeURIComponent(name)}/events`;
      const cacheKey = CACHE_KEYS.EVENTS(name);
      
      const params: Record<string, string> = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      
      const events = await this.makeRequest<Event[]>(endpoint, cacheKey, params);
      this.statsCollector.eventsFound += events.length;
      
      return events;
    } catch (error) {
      console.error(`Error fetching events for artist ${name}:`, error);
      return [];
    }
  }

  /**
   * Get an artist with their events in one call
   */
  async getArtistWithEvents(
    name: string, 
    dateFrom?: string, 
    dateTo?: string
  ): Promise<ArtistWithEvents | null> {
    try {
      const artist = await this.getArtist(name);
      if (!artist) return null;
      
      const events = await this.getArtistEvents(name, dateFrom, dateTo);
      
      return {
        ...artist,
        events
      };
    } catch (error) {
      console.error(`Error fetching artist with events for ${name}:`, error);
      return null;
    }
  }

  /**
   * Process a batch of artists and get their data with events
   */
  async processArtistBatch(
    artistNames: string[], 
    dateFrom?: string, 
    dateTo?: string
  ): Promise<ArtistWithEvents[]> {
    // Process artists sequentially to better respect rate limits
    const results: (ArtistWithEvents | null)[] = [];
    
    for (const name of artistNames) {
      try {
        const artistData = await this.getArtistWithEvents(name, dateFrom, dateTo);
        results.push(artistData);
        
        // Small delay between individual artist requests
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error fetching data for artist ${name}:`, error);
        results.push(null);
      }
    }
    
    return results.filter(artist => artist !== null) as ArtistWithEvents[];
  }

  /**
   * Get multiple artists with their events, using batching to avoid rate limits
   */
  async getMultipleArtistsWithEvents(
    artistNames: string[], 
    dateFrom?: string, 
    dateTo?: string,
    onProgress?: (completed: number, total: number) => void
  ): Promise<ArtistWithEvents[]> {
    const results: ArtistWithEvents[] = [];
    const batchCount = Math.ceil(artistNames.length / BATCH_SIZE);
    
    console.log(`Processing ${artistNames.length} artists in ${batchCount} batches of ${BATCH_SIZE}`);
    
    for (let i = 0; i < artistNames.length; i += BATCH_SIZE) {
      try {
        const batch = artistNames.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        
        console.log(`Processing batch ${batchNumber}/${batchCount} (${batch.length} artists)`);
        
        const batchResults = await this.processArtistBatch(batch, dateFrom, dateTo);
        
        if (batchResults && batchResults.length > 0) {
          console.log(`Batch ${batchNumber} returned ${batchResults.length} results`);
          results.push(...batchResults);
        } else {
          console.log(`Batch ${batchNumber} returned no results`);
        }
        
        const completedCount = Math.min(i + BATCH_SIZE, artistNames.length);
        if (onProgress) {
          onProgress(completedCount, artistNames.length);
        }
        
        if (i + BATCH_SIZE < artistNames.length) {
          // Use current batch delay (allows for adjusting this dynamically if needed in future)
          console.log(`Waiting ${BATCH_DELAY}ms before next batch...`);
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
        }
      } catch (error) {
        console.error(`Error processing batch starting at index ${i}:`, error);
        // Continue with the next batch rather than failing completely
      }
    }
    
    console.log(`Completed processing all batches, found ${results.length} artists with events`);
    return results;
  }

  /**
   * Get events for a specific venue
   */
  async getVenueEvents(venueName: string, location: string): Promise<Event[]> {
    try {
      if (!this.apiKey) {
        throw new Error('No API key configured');
      }

      const cacheKey = `venue_events:${venueName}:${location}`;
      
      // Check cache first
      const cachedData = API_CACHE.get<Event[]>(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      // Make API request
      const response = await axios.get(
        `${API_BASE_URL}/venues/events`,
        { 
          params: { 
            app_id: this.apiKey,
            venue: venueName,
            location: location
          },
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 403) {
        throw new Error('API key unauthorized - please check your Bandsintown API key');
      }

      // Cache the results
      API_CACHE.set(cacheKey, response.data);
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        console.error('Bandsintown API authorization failed - invalid API key');
      } else {
        console.error(`Error fetching events for venue ${venueName}:`, error);
      }
      throw error;
    }
  }

  /**
   * Clear all cache entries
   */
  clearCache(): void {
    API_CACHE.flushAll();
    console.log('API cache cleared');
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { keys: number, hits: number, misses: number } {
    return {
      keys: API_CACHE.keys().length,
      hits: API_CACHE.getStats().hits,
      misses: API_CACHE.getStats().misses
    };
  }
}