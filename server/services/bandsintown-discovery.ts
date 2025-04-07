import axios from 'axios';
import { storage } from '../storage';
import { differenceInDays, isAfter, isBefore, parseISO } from 'date-fns';
import NodeCache from 'node-cache';
import { Band, Venue } from '@shared/schema';

export interface RouteAnalysis {
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
  routingScore: number; // Added routing score
}

export interface BandDiscoveryResult {
  name: string;
  image: string;
  url: string;
  upcomingEvents: number;
  route: RouteAnalysis;
  events: any[];
}

// Cache to store artist search results (temporary, not persistent)
//const artistDiscoveryCache = new NodeCache({ stdTTL: 1800 }); // 30 minutes TTL

class BandsintownApi {
    private apiKey: string;
    private baseUrl = 'https://rest.bandsintown.com';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async getArtistEvents(artistName: string): Promise<any[]> {
        try {
            const response = await axios.get(
                `${this.baseUrl}/artists/${encodeURIComponent(artistName)}/events`,
                { params: { app_id: this.apiKey } }
            );
            return response.data;
        } catch (error) {
            console.error(`Error fetching events for ${artistName}:`, error);
            return [];
        }
    }

    async getArtist(artistName: string) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/artists/${encodeURIComponent(artistName)}`,
                { params: { app_id: this.apiKey } }
            );
            return response.data;
        } catch (error) {
            console.error(`Error fetching artist ${artistName}:`, error);
            return null;
        }
    }

}

export class BandsintownDiscovery {
  private api: BandsintownApi;
  private cache: NodeCache;

  constructor(apiKey: string) {
    this.api = new BandsintownApi(apiKey);
    this.cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour
  }

  private getCacheKey(type: string, query: string): string {
    return `${type}:${query}`;
  }

  async getArtistEvents(artistName: string) {
    const cacheKey = this.getCacheKey('artist', artistName);
    const cached = this.cache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const events = await this.api.getArtistEvents(artistName);
    this.cache.set(cacheKey, events);
    return events;
  }

  async getArtist(artistName: string) {
    const cacheKey = this.getCacheKey('artistInfo', artistName);
    const cached = this.cache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const artistInfo = await this.api.getArtist(artistName);
    this.cache.set(cacheKey, artistInfo);
    return artistInfo;
  }


}

/**
 * Service for discovering bands touring near venues using direct Bandsintown API calls
 */

export class BandsintownDiscoveryService {
  private apiKey: string;
  private discovery: BandsintownDiscovery;
  private baseUrl = 'https://rest.bandsintown.com';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.discovery = new BandsintownDiscovery(apiKey);
  }

  /**
   * Calculate distance between two points using the Haversine formula
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Search for popular artists in the Bandsintown API
   */
  async searchPopularArtists(): Promise<string[]> {
    // These are example popular artists that are likely touring
    const popularArtists = [
      "Beyoncé", "Ed Sheeran", "Taylor Swift", "Bruno Mars", "Coldplay",
      "Rihanna", "Justin Timberlake", "Lady Gaga", "The Weeknd", "Adele",
      "Imagine Dragons", "Post Malone", "Billie Eilish", "Ariana Grande",
      "Drake", "Harry Styles", "BTS", "Kendrick Lamar", "Pink", "Maroon 5",
      "The Killers", "The Rolling Stones", "Paul McCartney", "Pearl Jam",
      "Foo Fighters", "Green Day", "U2", "Red Hot Chili Peppers",
      "Mumford & Sons", "The Lumineers", "The Black Keys", "Arctic Monkeys",
      "Kings of Leon", "Death Cab for Cutie", "The Strokes", "Wilco",
      "Tame Impala", "Jack White", "Vampire Weekend", "Modest Mouse",
      "Arcade Fire", "The National", "Spoon", "Fleet Foxes", "Band of Horses"
    ];

    // Shuffle and return a subset to simulate search results
    return this.shuffleArray(popularArtists).slice(0, 20);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  /**
   * Find bands passing near a venue within a specific date range
   */
  async findBandsNearVenue(
    venueId: number,
    startDate: Date,
    endDate: Date,
    radius: number = 50
  ): Promise<BandDiscoveryResult[]> {
    // Get venue information
    const venue = await storage.getVenue(venueId);
    if (!venue || !venue.latitude || !venue.longitude) {
      throw new Error('Venue not found or missing location data');
    }

    const venueLat = parseFloat(venue.latitude);
    const venueLng = parseFloat(venue.longitude);

    // Get a list of artists to search
    const artistsToSearch = await this.searchPopularArtists();
    const results: BandDiscoveryResult[] = [];

    // Process 5 artists at a time to avoid overwhelming the API
    const batchSize = 5;
    for (let i = 0; i < artistsToSearch.length; i += batchSize) {
      const batch = artistsToSearch.slice(i, i + batchSize);
      await Promise.all(batch.map(async (artistName) => {
        try {
          // Get artist information
          const artistInfo = await this.discovery.getArtist(artistName);
          if (!artistInfo) return;

          // Get artist events
          const events = await this.discovery.getArtistEvents(artistName);


          // Filter to events in our date range
          const filteredEvents = events.filter(event => {
            const eventDate = parseISO(event.datetime);
            return isAfter(eventDate, startDate) && isBefore(eventDate, endDate);
          });

          if (filteredEvents.length < 2) return; // Need at least 2 events to form a route

          // Analyze the route to see if this venue fits
          const routeAnalysis = this.analyzeRouteForVenueFit(
            filteredEvents, venueLat, venueLng, radius
          );

          if (routeAnalysis && routeAnalysis.distanceToVenue <= radius) {
            const discoveryResult: BandDiscoveryResult = {
              name: artistInfo.name,
              image: artistInfo.image_url,
              url: artistInfo.url,
              upcomingEvents: artistInfo.upcoming_event_count,
              route: routeAnalysis,
              events: filteredEvents
            };

            // Add to results
            results.push(discoveryResult);
          }
        } catch (error) {
          console.error(`Error analyzing artist ${artistName}:`, error);
        }
      }));

      // Small delay between batches
      if (i + batchSize < artistsToSearch.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Sort results by best fit (closest to route with most available days)
    results.sort((a, b) => {
      // Prioritize by detour distance (lower is better)
      const detourDiff = a.route.detourDistance - b.route.detourDistance;

      // If detour distances are close, prioritize by days available
      if (Math.abs(detourDiff) < 10) {
        return b.route.daysAvailable - a.route.daysAvailable;
      }

      return detourDiff;
    });

    return results;
  }

  /**
   * Analyze a tour route to see if a venue fits
   */
  private analyzeRouteForVenueFit(
    events: any[],
    venueLat: number,
    venueLng: number,
    radius: number,
    minDaysBetween = 2, // Increased minimum days between shows
    maxDetourMultiplier = 1.5 // Reduced max detour multiplier for better efficiency
  ): RouteAnalysis | null {
    // Validation
    if (!events?.length || !venueLat || !venueLng) {
      return null;
    }

    // Constants for scoring
    const DISTANCE_WEIGHT = 0.4;
    const TIME_WEIGHT = 0.3;
    const ROUTING_WEIGHT = 0.3;
    const MAX_ACCEPTABLE_DETOUR = 300; // km
    if (events.length < 2) return null;

    // Sort events by date
    const sortedEvents = [...events].sort(
      (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
    );

    // Find potential gaps where venue could fit
    let bestFit: RouteAnalysis | null = null;

    for (let i = 0; i < sortedEvents.length - 1; i++) {
      const event1 = sortedEvents[i];
      const event2 = sortedEvents[i + 1];

      const date1 = parseISO(event1.datetime);
      const date2 = parseISO(event2.datetime);

      // Calculate the days between events
      const daysBetween = differenceInDays(date2, date1);

      // Skip if events are too close together (need at least 1 day)
      if (daysBetween < minDaysBetween) continue;

      // Get coordinates of events
      const lat1 = parseFloat(event1.venue.latitude || '0');
      const lng1 = parseFloat(event1.venue.longitude || '0');
      const lat2 = parseFloat(event2.venue.latitude || '0');
      const lng2 = parseFloat(event2.venue.longitude || '0');

      // Skip if any event is missing coordinates
      if (!lat1 || !lng1 || !lat2 || !lng2) continue;

      // Calculate original distance between events
      const originalDistance = this.calculateDistance(lat1, lng1, lat2, lng2);

      // Calculate distances to venue
      const distanceToVenue1 = this.calculateDistance(lat1, lng1, venueLat, venueLng);
      const distanceToVenue2 = this.calculateDistance(lat2, lng2, venueLat, venueLng);

      // Calculate detour distance with weighted factors
      const detourDistance = distanceToVenue1 + distanceToVenue2 - originalDistance;
      const timeFlexibility = daysBetween / minDaysBetween;
      const distanceEfficiency = 1 - (detourDistance / originalDistance);

      // Calculate routing score (0-100)
      const routingScore = Math.min(100, Math.round(
        (timeFlexibility * 40) +
        (distanceEfficiency * 40) +
        (Math.min(1, radius / detourDistance) * 20)
      ));

      // Skip if detour is too inefficient
      const maxDetour = Math.max(originalDistance * maxDetourMultiplier, radius * 2);
      if (detourDistance > maxDetour || routingScore < 40) continue;

      // This is a potential fit
      const routeAnalysis: RouteAnalysis = {
        origin: {
          city: event1.venue.city,
          state: event1.venue.region,
          date: event1.datetime,
          lat: lat1,
          lng: lng1
        },
        destination: {
          city: event2.venue.city,
          state: event2.venue.region,
          date: event2.datetime,
          lat: lat2,
          lng: lng2
        },
        distanceToVenue: Math.min(distanceToVenue1, distanceToVenue2),
        detourDistance,
        daysAvailable: daysBetween,
        routingScore // Added routing score
      };

      // Update best fit if this is the first or better than current
      if (!bestFit || this.compareRouteAnalysis(routeAnalysis, bestFit)) {
        bestFit = routeAnalysis;
      }
    }

    return bestFit;
  }

  /**
   * Compare two route analyses to determine which is better
   * Return true if route1 is better than route2
   */
  private compareRouteAnalysis(route1: RouteAnalysis, route2: RouteAnalysis): boolean {
    // First priority: Minimize detour distance, but normalize by available days
    const normalizedDetour1 = route1.detourDistance / Math.max(1, route1.daysAvailable);
    const normalizedDetour2 = route2.detourDistance / Math.max(1, route2.daysAvailable);

    // If there's a significant difference in normalized detour
    if (Math.abs(normalizedDetour1 - normalizedDetour2) > 10) {
      return normalizedDetour1 < normalizedDetour2;
    }

    // Second priority: More days available is better
    return route1.daysAvailable > route2.daysAvailable;
  }
}

/**
 * Create a Bandsintown discovery service with the provided API key
 */
let discoveryService: BandsintownDiscoveryService | null = null;

export function createBandsintownDiscoveryService(apiKey: string): BandsintownDiscoveryService {
  if (!discoveryService) {
    discoveryService = new BandsintownDiscoveryService(apiKey);
  }
  return discoveryService;
}