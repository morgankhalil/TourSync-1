/**
 * Enhanced Bandsintown Discovery Service
 * Features:
 * - Uses the enhanced BandsintownApiService for better API handling
 * - Expanded artist database for more discovery options
 * - Improved routing algorithm with more factors
 * - Better handling of timeframes and date ranges
 */

import { BandsintownApiService, ArtistWithEvents, Event } from './bandsintown-api';
import { getArtistsToQuery } from './artists-database';
import { Venue } from '@/types';

// Type definitions for discovery results
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
  routingScore: number;
}

export interface BandDiscoveryResult {
  name: string;
  image: string;
  url: string;
  upcomingEvents: number;
  route: RouteAnalysis;
  events: Event[];
  genre?: string;
  bandsintownId?: string;
  drawSize?: number;
  website?: string;
}

export interface DiscoveryOptions {
  venueId: number;
  startDate: string;
  endDate: string;
  radius?: number;
  genres?: string[];
  lookAheadDays?: number; // How many days beyond endDate to look
  maxBands?: number; // Maximum number of bands to return
  maxDistance?: number; // Maximum distance to venue
  onProgress?: (completed: number, total: number) => void;
  onIncrementalResults?: (results: BandDiscoveryResult[]) => void;
  useDemo?: boolean; // Flag to use demo data
}

export interface DiscoveryResults {
  data: BandDiscoveryResult[];
  venue: Venue;
  stats: {
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
  };
}

export class EnhancedBandsintownDiscoveryService {
  private readonly cache: NodeCache;
  private readonly apiService: BandsintownApiService;
  private readonly MAX_CONCURRENT_REQUESTS = 3;
  private readonly REQUEST_DELAY = 1000; // 1 second between requests
  private readonly MAX_SEARCH_RADIUS = 500; // km
  private readonly MIN_VENUE_CAPACITY = 100;

  constructor(apiKey: string) {
    this.apiService = new BandsintownApiService(apiKey);
    this.cache = new NodeCache({ 
      stdTTL: 3600,
      checkperiod: 120
    });
  }

  /**
   * Initialize the service and validate configuration
   */
  async initialize(): Promise<void> {
    await this.apiService.validateApiKey();
    console.log('Enhanced Bandsintown Discovery Service initialized');
  }
  private apiService: BandsintownApiService;

  constructor(apiKey: string) {
    this.apiService = new BandsintownApiService(apiKey);
  }

  /**
   * Check connection status to the Bandsintown API
   */
  async checkStatus(): Promise<{ 
    status: string; 
    apiKeyConfigured: boolean; 
    discoveryEnabled: boolean;
    cacheStats: { keys: number; hits: number; misses: number };
  }> {
    const apiKeyConfigured = !!this.apiService;

    try {
      // Test the API connection with a known artist
      const testArtist = await this.apiService.getArtist('Radiohead');

      const status = testArtist ? 'ok' : 'error';

      return {
        status,
        apiKeyConfigured,
        discoveryEnabled: apiKeyConfigured && status === 'ok',
        cacheStats: this.apiService.getCacheStats()
      };
    } catch (error) {
      console.error('Error checking Bandsintown API status:', error);

      return {
        status: 'error',
        apiKeyConfigured,
        discoveryEnabled: false,
        cacheStats: this.apiService.getCacheStats()
      };
    }
  }

  /**
   * Calculate the distance between two points using the Haversine formula
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3958.8; // Earth's radius in miles
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    // Return distance in miles, rounded to 1 decimal place
    return Math.round(R * c * 10) / 10;
  }

  /**
   * Convert degrees to radians
   */
  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Calculate a routing score to rank bands' proximity and fit
   * Lower score = better fit for the venue
   */
  private calculateRoutingScore(
    distanceToVenue: number,
    detourDistance: number,
    daysBetween: number
  ): number {
    // Distance penalty (0-100 points)
    const distancePenalty = distanceToVenue > 200
      ? 100
      : Math.round((distanceToVenue / 200) * 100);

    // Detour penalty (0-100 points)
    // If detour is more than 2x the distance to venue or more than 200 miles, max penalty
    const maxAcceptableDetour = Math.min(distanceToVenue * 2, 200);
    const detourPenalty = detourDistance > maxAcceptableDetour
      ? 100
      : Math.round((detourDistance / maxAcceptableDetour) * 100);

    // Days penalty (0-100 points)
    // Ideal is 1-3 days between shows, with 2 being perfect
    // More than 5 days might mean they have other plans or are taking a break
    let daysPenalty = 100;
    if (daysBetween === 2) daysPenalty = 0;  // Perfect
    else if (daysBetween === 1 || daysBetween === 3) daysPenalty = 10; // Great
    else if (daysBetween === 4) daysPenalty = 30; // Good
    else if (daysBetween === 5) daysPenalty = 50; // Acceptable
    else if (daysBetween > 5) daysPenalty = 50 + (daysBetween - 5) * 10; // Less ideal

    // Overall score (0-300, lower is better)
    // We give higher weight to distance (1.5x) and detour (1.2x) factors
    return distancePenalty * 1.5 + detourPenalty * 1.2 + daysPenalty * 0.8;
  }

  /**
   * Find bands that will be passing near a venue in a given date range
   */
  async findBandsNearVenue(options: DiscoveryOptions): Promise<DiscoveryResults> {
    const startTime = Date.now();
    this.apiService.resetStats();

    const {
      venueId,
      startDate,
      endDate,
      radius = 50,
      genres = [],
      lookAheadDays = 90, // Default to 90 days lookahead
      maxBands = 20,
      maxDistance = 200, // Max 200 miles from venue
      onProgress
    } = options;

    try {
      // Step 1: Import storage and get venue details
      const { storage } = await import('../storage');
      const venue = await storage.getVenue(venueId);

      if (!venue) {
        throw new Error(`Venue with ID ${venueId} not found`);
      }

      if (!venue.latitude || !venue.longitude) {
        throw new Error(`Venue "${venue.name}" is missing location data`);
      }

      // Step 2: Calculate extended end date for lookahead search
      const endDateObj = new Date(endDate);
      const extendedEndDateObj = new Date(endDateObj);
      extendedEndDateObj.setDate(extendedEndDateObj.getDate() + lookAheadDays);
      const extendedEndDate = extendedEndDateObj.toISOString().split('T')[0];

      // Step 3: Get list of artists to query
      const expandedRadius = Math.max(radius, maxDistance);
      const artistsToQuery = getArtistsToQuery({
        limit: 250, // Query more artists than we used to
        genres
      });

      console.log(`Enhanced discovery - querying ${artistsToQuery.length} artists from ${startDate} to ${extendedEndDate} within ${expandedRadius} miles`);

      // Step 4: Fetch artist data with events
      const artistsWithEvents = await this.apiService.getMultipleArtistsWithEvents(
        artistsToQuery,
        startDate,
        extendedEndDate, // Use the extended end date for lookahead
        onProgress
      );

      // Step 5: Analyze each artist for routing opportunities
      const bandDiscoveryResults: BandDiscoveryResult[] = [];
      const incremental: { results: BandDiscoveryResult[], lastSent: number } = { 
        results: [], 
        lastSent: 0 
      };

      for (const artist of artistsWithEvents) {
        // Skip artists with no events
        if (!artist.events || artist.events.length === 0) {
          continue;
        }

        // Sort events by date
        const sortedEvents = [...artist.events].sort(
          (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
        );

        // Metadata to store our best routing opportunity for this artist
        let bestRoute: RouteAnalysis | null = null;
        let bestScore = Infinity;

        // SCENARIO 1: Check single event opportunities
        if (sortedEvents.length === 1) {
          const event = sortedEvents[0];
          const eventLat = parseFloat(event.venue.latitude || '0');
          const eventLng = parseFloat(event.venue.longitude || '0');

          if (eventLat && eventLng) {
            const distanceToVenue = this.calculateDistance(
              parseFloat(venue.latitude),
              parseFloat(venue.longitude),
              eventLat,
              eventLng
            );

            // Consider single events within the expanded radius
            if (distanceToVenue <= expandedRadius) {
              const routeScore = this.calculateRoutingScore(
                distanceToVenue,  // Distance to venue
                distanceToVenue * 2,  // Round trip detour
                1  // Assume 1 day available
              );

              bestRoute = {
                origin: {
                  city: event.venue.city,
                  state: event.venue.region,
                  date: event.datetime,
                  lat: eventLat,
                  lng: eventLng
                },
                destination: null, // Single event, so no destination
                distanceToVenue: Math.round(distanceToVenue),
                detourDistance: Math.round(distanceToVenue * 2), // Round trip
                daysAvailable: 1, // Assume 1 day available
                routingScore: routeScore // Add a score for better sorting
              };

              bestScore = routeScore;
            }
          }
        }

        // SCENARIO 2: Find routing opportunities between consecutive events
        for (let i = 0; i < sortedEvents.length - 1; i++) {
          const event1 = sortedEvents[i];
          const event2 = sortedEvents[i + 1];

          const event1Date = new Date(event1.datetime);
          const event2Date = new Date(event2.datetime);

          // Calculate days between events
          const daysBetween = Math.floor(
            (event2Date.getTime() - event1Date.getTime()) / (1000 * 60 * 60 * 24)
          );

          // If less than 1 day between shows, definitely no time for our venue
          if (daysBetween < 1) continue;

          // Get venue coordinates
          const event1Lat = parseFloat(event1.venue.latitude || '0');
          const event1Lng = parseFloat(event1.venue.longitude || '0');
          const event2Lat = parseFloat(event2.venue.latitude || '0');
          const event2Lng = parseFloat(event2.venue.longitude || '0');

          if (!event1Lat || !event1Lng || !event2Lat || !event2Lng) {
            continue; // Skip if venue coordinates are missing
          }

          // Calculate distance from our venue to each event
          const distanceToEvent1 = this.calculateDistance(
            parseFloat(venue.latitude),
            parseFloat(venue.longitude),
            event1Lat,
            event1Lng
          );

          const distanceToEvent2 = this.calculateDistance(
            parseFloat(venue.latitude),
            parseFloat(venue.longitude),
            event2Lat,
            event2Lng
          );

          // Take the minimum distance as "distance to route"
          const distanceToVenue = Math.min(distanceToEvent1, distanceToEvent2);

          // Only consider if at least one of their events is within our expanded radius
          if (distanceToVenue > expandedRadius) continue;

          // Calculate direct distance between the two shows (their original route)
          const directDistance = this.calculateDistance(
            event1Lat,
            event1Lng,
            event2Lat,
            event2Lng
          );

          // Calculate detour distance (their original city → our venue → their next city)
          const detourDistance = this.calculateDistance(
            event1Lat,
            event1Lng,
            parseFloat(venue.latitude),
            parseFloat(venue.longitude)
          ) + this.calculateDistance(
            parseFloat(venue.latitude),
            parseFloat(venue.longitude),
            event2Lat,
            event2Lng
          );

          // Calculate how much extra driving this would add to their tour
          const extraDistance = detourDistance - directDistance;

          // Calculate a routing score for this opportunity
          const routeScore = this.calculateRoutingScore(
            distanceToVenue,  // How far is our venue from their route?
            extraDistance,    // How much extra driving would they do?
            daysBetween       // How many days do they have available?
          );

          // If this route scores better than our current best, update it
          if (routeScore < bestScore) {
            bestRoute = {
              origin: {
                city: event1.venue.city,
                state: event1.venue.region,
                date: event1.datetime,
                lat: event1Lat,
                lng: event1Lng
              },
              destination: {
                city: event2.venue.city,
                state: event2.venue.region,
                date: event2.datetime,
                lat: event2Lat,
                lng: event2Lng
              },
              distanceToVenue: Math.round(distanceToVenue),
              detourDistance: Math.round(extraDistance),
              daysAvailable: daysBetween,
              routingScore: routeScore // Add a score for better sorting
            };

            bestScore = routeScore;
          }
        }

        // If we found a good routing opportunity for this artist
        if (bestRoute) {
          const newResult = {
            name: artist.name,
            image: artist.image_url,
            url: artist.url,
            upcomingEvents: artist.upcoming_event_count,
            route: bestRoute,
            events: sortedEvents,
            bandsintownId: artist.id
          };
          
          bandDiscoveryResults.push(newResult);
          incremental.results.push(newResult);
          
          // Send incremental results as soon as we get a match (one at a time)
          // This allows the UI to update immediately when we find a good match
          if (options.onIncrementalResults && incremental.results.length > 0) {
            options.onIncrementalResults([...incremental.results]);
            incremental.results = [];
            incremental.lastSent = Date.now();
          }
        }
      }

      // Step 6: Sort results by routing score (lower is better) and limit to maxBands
      bandDiscoveryResults.sort((a, b) => a.route.routingScore - b.route.routingScore);

      // Return results limited to maxBands
      const limitedResults = bandDiscoveryResults.slice(0, maxBands || 20);

      console.log(`Discovery completed: Processed ${artistsWithEvents.length} artists, found ${bandDiscoveryResults.length} matches`);

      // If we have no results, add some demo data in development
      if (limitedResults.length === 0 && process.env.NODE_ENV !== 'production') {
        console.log('No results found, adding demo data for testing UI');
        // Add 3 demo artists with mock routes
        const demoData = this.generateDemoDiscoveryData(venue);
        limitedResults.push(...demoData);
      }

      // Step 7: Collect and return stats
      const apiStats = this.apiService.getStats();
      const cacheStats = this.apiService.getCacheStats();
      const elapsedTimeMs = Date.now() - startTime;

      return {
        data: limitedResults,
        venue,
        stats: {
          artistsQueried: apiStats.artistsQueried,
          artistsWithEvents: artistsWithEvents.length,
          artistsPassingNear: limitedResults.length,
          totalEventsFound: apiStats.eventsFound,
          elapsedTimeMs,
          apiCacheStats: cacheStats
        }
      };
    } catch (error) {
      console.error('Error finding bands near venue:', error);
      throw error;
    }
  }

  private generateDemoDiscoveryData(venue: Venue): BandDiscoveryResult[] {
    // This is a placeholder.  Replace with actual demo data generation logic.
    return [
      {
        name: 'Demo Band 1',
        image: 'demo-image-1.jpg',
        url: 'demo-url-1',
        upcomingEvents: 3,
        route: {
          origin: { city: 'City A', state: 'ST A', date: '2024-03-15', lat: 34.0522, lng: -118.2437 },
          destination: { city: 'City B', state: 'ST B', date: '2024-03-18', lat: 37.7749, lng: -122.4194 },
          distanceToVenue: 50,
          detourDistance: 100,
          daysAvailable: 3,
          routingScore: 100
        },
        events: []
      },
      {
        name: 'Demo Band 2',
        image: 'demo-image-2.jpg',
        url: 'demo-url-2',
        upcomingEvents: 2,
        route: {
          origin: { city: 'City C', state: 'ST C', date: '2024-03-20', lat: 40.7128, lng: -74.0060 },
          destination: { city: 'City D', state: 'ST D', date: '2024-03-22', lat: 39.9526, lng: -75.1652 },
          distanceToVenue: 75,
          detourDistance: 150,
          daysAvailable: 2,
          routingScore: 150
        },
        events: []
      },
      {
        name: 'Demo Band 3',
        image: 'demo-image-3.jpg',
        url: 'demo-url-3',
        upcomingEvents: 1,
        route: {
          origin: { city: 'City E', state: 'ST E', date: '2024-03-25', lat: 41.8781, lng: -87.6298 },
          destination: null,
          distanceToVenue: 25,
          detourDistance: 50,
          daysAvailable: 1,
          routingScore: 50
        },
        events: []
      }
    ];
  }


  /**
   * Clear API cache
   */
  clearCache(): void {
    this.apiService.clearCache();
  }
}