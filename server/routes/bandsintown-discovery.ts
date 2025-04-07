import { Express, Request, Response } from 'express';
import axios from 'axios';
import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';

// Validation schema for the request body
const discoverBandsSchema = z.object({
  venueId: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  radius: z.number().optional().default(50)
});

/**
 * Service interface for Bandsintown discovery operations
 */
interface BandsintownDiscoveryService {
  findBandsNearVenue(venueId: number, startDate: string, endDate: string, radius?: number): Promise<any>;
  checkStatus(): Promise<{ status: string; apiKeyConfigured: boolean; discoveryEnabled: boolean }>;
}

/**
 * Real implementation of the discovery service
 * This service directly polls the Bandsintown API without storing data in the database
 */
class RealBandsintownDiscoveryService implements BandsintownDiscoveryService {
  private apiKey: string;
  
  constructor() {
    this.apiKey = process.env.BANDSINTOWN_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Bandsintown API key not configured. Discovery features will be limited.');
    }
  }
  
  /**
   * Find bands that will be near the specified venue in the given date range
   */
  async findBandsNearVenue(venueId: number, startDate: string, endDate: string, radius: number = 50): Promise<any> {
    if (!this.apiKey) {
      throw new Error('Bandsintown API key not configured');
    }
    
    try {
      // Step 1: Get the venue details to get location
      const { storage } = await import('../storage');
      const venue = await storage.getVenue(venueId);
      
      if (!venue) {
        throw new Error(`Venue with ID ${venueId} not found`);
      }
      
      if (!venue.latitude || !venue.longitude) {
        throw new Error(`Venue "${venue.name}" is missing location data`);
      }
      
      // Step 2: Get popular artists playing in the area
      // For now, we'll start with a predefined list of popular artists to check
      // This approach is more reliable than using the discover endpoint which is limited
      const popularArtists = [
        'Taylor Swift', 'Beyoncé', 'Ed Sheeran', 'Drake', 'Coldplay', 
        'Bruno Mars', 'Adele', 'The Weeknd', 'Billie Eilish', 'Lady Gaga',
        'Post Malone', 'Twenty One Pilots', 'Imagine Dragons', 'Shawn Mendes',
        'Dua Lipa', 'Harry Styles', 'BTS', 'Justin Bieber', 'Ariana Grande',
        'Kendrick Lamar', 'The Killers', 'Foo Fighters', 'Green Day', 'Metallica',
        'Pearl Jam', 'Red Hot Chili Peppers', 'Rage Against The Machine', 'Tool',
        'Jack White', 'Tame Impala', 'Arctic Monkeys', 'The Strokes', 'Vampire Weekend',
        'The Black Keys', 'The National', 'Radiohead', 'Arcade Fire', 'LCD Soundsystem',
        'The War On Drugs', 'Spoon', 'Fleet Foxes', 'Bon Iver', 'Sufjan Stevens',
        'St. Vincent', 'Angel Olsen', 'Phoebe Bridgers', 'Mitski', 'Japanese Breakfast'
      ];
      
      console.log(`Fetching events for ${popularArtists.length} popular artists`);
      
      // Step 3: For each artist, get their events
      const artistsWithEventsPromises = popularArtists.map(async (artistName) => {
        try {
          // First get artist info
          const artistResponse = await axios.get(
            `https://rest.bandsintown.com/artists/${encodeURIComponent(artistName)}?app_id=${this.apiKey}`
          );
          const artist = artistResponse.data;
          
          // Then get their events
          const eventsResponse = await axios.get(
            `https://rest.bandsintown.com/artists/${encodeURIComponent(artistName)}/events?app_id=${this.apiKey}`
          );
          const events = eventsResponse.data;
          
          // Filter to only include events in the specified date range
          const filteredEvents = events.filter((event: any) => {
            const eventDate = new Date(event.datetime);
            return eventDate >= new Date(startDate) && eventDate <= new Date(endDate);
          });
          
          return {
            ...artist,
            events: filteredEvents
          };
        } catch (error) {
          console.error(`Error fetching data for artist ${artistName}:`, error);
          return null;
        }
      });
      
      const artistsWithEvents = await Promise.all(artistsWithEventsPromises);
      const validArtists = artistsWithEvents.filter(artist => artist !== null);
      
      // Step 4: Calculate which artists are passing "near" the venue
      // Filter for artists with at least 2 events in the date range
      const artistsWithRoutes = validArtists
        .filter(artist => artist && artist.events && artist.events.length >= 2)
        .map(artist => {
          // Sort events by date
          const sortedEvents = [...artist.events].sort((a: any, b: any) => 
            new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
          );
          
          // Find pairs of consecutive events that our venue could fit between
          let bestRoute = null;
          
          for (let i = 0; i < sortedEvents.length - 1; i++) {
            const event1 = sortedEvents[i];
            const event2 = sortedEvents[i + 1];
            
            const event1Date = new Date(event1.datetime);
            const event2Date = new Date(event2.datetime);
            
            // Calculate days between events
            const daysBetween = Math.floor(
              (event2Date.getTime() - event1Date.getTime()) / (1000 * 60 * 60 * 24)
            );
            
            // If less than 2 days between shows, probably not enough time for our venue
            if (daysBetween < 2) continue;
            
            // Calculate the midpoint between the two venues
            const event1Lat = parseFloat(event1.venue.latitude || '0');
            const event1Lng = parseFloat(event1.venue.longitude || '0');
            const event2Lat = parseFloat(event2.venue.latitude || '0');
            const event2Lng = parseFloat(event2.venue.longitude || '0');
            
            if (!event1Lat || !event1Lng || !event2Lat || !event2Lng) {
              continue; // Skip if venue coordinates are missing
            }
            
            const midpointLat = (event1Lat + event2Lat) / 2;
            const midpointLng = (event1Lng + event2Lng) / 2;
            
            // Calculate distance from our venue to the midpoint
            const distanceToVenue = this.calculateDistance(
              parseFloat(venue.latitude), 
              parseFloat(venue.longitude), 
              midpointLat, 
              midpointLng
            );
            
            // Calculate direct distance between the two shows
            const directDistance = this.calculateDistance(
              event1Lat,
              event1Lng,
              event2Lat,
              event2Lng
            );
            
            // Calculate detour distance (distance to our venue and then to the next show)
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
            
            // If we don't have a route yet, or this one is better, use it
            if (!bestRoute || extraDistance < bestRoute.detourDistance) {
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
                daysAvailable: daysBetween
              };
            }
          }
          
          if (bestRoute) {
            return {
              name: artist.name,
              image: artist.image_url,
              url: artist.url,
              upcomingEvents: artist.upcoming_event_count,
              route: bestRoute,
              events: sortedEvents
            };
          }
          
          return null;
        })
        .filter(artist => artist !== null)
        // Sort by distance to venue
        .sort((a: any, b: any) => a.route.distanceToVenue - b.route.distanceToVenue);
      
      return {
        data: artistsWithRoutes,
        venue: venue
      };
    } catch (error) {
      console.error('Error finding bands near venue:', error);
      throw error;
    }
  }
  
  /**
   * Check the status of the Bandsintown discovery service
   */
  async checkStatus(): Promise<{ status: string; apiKeyConfigured: boolean; discoveryEnabled: boolean }> {
    const apiKeyConfigured = !!this.apiKey;
    
    return {
      status: apiKeyConfigured ? 'ok' : 'error',
      apiKeyConfigured,
      discoveryEnabled: apiKeyConfigured // Enable discovery if API key is configured
    };
  }
  
  /**
   * Helper method to calculate distance between two points using Haversine formula
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
    const distance = R * c;
    return distance;
  }
  
  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

/**
 * Get the appropriate discovery service instance
 */
function getDiscoveryService(): BandsintownDiscoveryService {
  return new RealBandsintownDiscoveryService();
}

/**
 * Register routes for Bandsintown discovery features
 */
export function registerBandsintownDiscoveryRoutes(app: Express): void {
  /**
   * Find bands passing near a venue within a date range without database storage
   * This is the direct API-based version of the artist discovery feature
   */
  app.post('/api/bandsintown/discover-bands-near-venue', async (req: Request, res: Response) => {
    try {
      // Validate the request body
      const validationResult = discoverBandsSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        const errorMessage = fromZodError(validationResult.error).message;
        return res.status(400).json({ error: errorMessage });
      }
      
      const { venueId, startDate, endDate, radius } = validationResult.data;
      
      // Get the discovery service and call the method
      const discoveryService = getDiscoveryService();
      const result = await discoveryService.findBandsNearVenue(venueId, startDate, endDate, radius);
      
      res.json(result);
    } catch (error) {
      console.error('Error discovering bands near venue:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Error discovering bands near venue'
      });
    }
  });
  
  /**
   * Get status of Bandsintown discovery API connection
   */
  app.get('/api/bandsintown/discovery-status', async (_req: Request, res: Response) => {
    try {
      const discoveryService = getDiscoveryService();
      const status = await discoveryService.checkStatus();
      
      res.json(status);
    } catch (error) {
      console.error('Error checking Bandsintown discovery status:', error);
      res.status(500).json({ 
        status: 'error',
        apiKeyConfigured: false,
        discoveryEnabled: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}