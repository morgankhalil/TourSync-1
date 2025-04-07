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
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000; // 1 second
const BATCH_SIZE = 10; // Process 10 artists at a time to avoid rate limits
const BATCH_DELAY = 2000; // 2 seconds between batches

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
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retries));
        
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
    const promises = artistNames.map(name => 
      this.getArtistWithEvents(name, dateFrom, dateTo)
    );
    
    const results = await Promise.all(promises);
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
      const batch = artistNames.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      
      console.log(`Processing batch ${batchNumber}/${batchCount} (${batch.length} artists)`);
      
      const batchResults = await this.processArtistBatch(batch, dateFrom, dateTo);
      results.push(...batchResults);
      
      const completedCount = Math.min(i + BATCH_SIZE, artistNames.length);
      if (onProgress) {
        onProgress(completedCount, artistNames.length);
      }
      
      if (i + BATCH_SIZE < artistNames.length) {
        console.log(`Waiting ${BATCH_DELAY}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
      }
    }
    
    return results;
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