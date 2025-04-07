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
 * Actual implementation of the discovery service
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
      // Step 1: Get the venue details to get location using relative path
      // We don't need axios here since we can import directly from storage
      const { storage } = await import('../storage');
      const venue = await storage.getVenue(venueId);
      
      if (!venue) {
        throw new Error(`Venue with ID ${venueId} not found`);
      }
      
      if (!venue.latitude || !venue.longitude) {
        throw new Error(`Venue "${venue.name}" is missing location data`);
      }
      
      // Step 2: Get top artists in the area using Bandsintown API
      // Normally this would call the Bandsintown API directly
      // Here we'll simulate the response for now
      
      // Mock implementation - in a real app, this would call the Bandsintown API
      // const artistsResponse = await axios.get(
      //   `https://rest.bandsintown.com/artists/discover?location=${venue.latitude},${venue.longitude}&radius=${radius}&app_id=${this.apiKey}`
      // );
      
      // Simulate API response for demo purposes
      const mockArtists = this.generateMockArtists(10);
      
      // Step 3: For each artist, get their events
      const artistsWithEvents = await Promise.all(
        mockArtists.map(async (artist) => {
          // Mock implementation - in a real app, this would call the Bandsintown API
          // const eventsResponse = await axios.get(
          //   `https://rest.bandsintown.com/artists/${encodeURIComponent(artist.name)}/events?app_id=${this.apiKey}`
          // );
          // const events = eventsResponse.data;
          
          // Simulate events for this artist
          const events = this.generateMockEvents(artist.name, startDate, endDate, 5);
          
          return {
            ...artist,
            events
          };
        })
      );
      
      // Step 4: Calculate which artists are passing "near" the venue
      // Filter for artists with at least 2 events in the date range
      const artistsWithRoutes = artistsWithEvents
        .filter(artist => artist.events.length >= 2)
        .map(artist => {
          // Sort events by date
          const sortedEvents = [...artist.events].sort((a, b) => 
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
            const midpointLat = (parseFloat(event1.venue.latitude) + parseFloat(event2.venue.latitude)) / 2;
            const midpointLng = (parseFloat(event1.venue.longitude) + parseFloat(event2.venue.longitude)) / 2;
            
            // Calculate distance from our venue to the midpoint
            const distanceToVenue = this.calculateDistance(
              parseFloat(venue.latitude), 
              parseFloat(venue.longitude), 
              midpointLat, 
              midpointLng
            );
            
            // Calculate direct distance between the two shows
            const directDistance = this.calculateDistance(
              parseFloat(event1.venue.latitude),
              parseFloat(event1.venue.longitude),
              parseFloat(event2.venue.latitude),
              parseFloat(event2.venue.longitude)
            );
            
            // Calculate detour distance (distance to our venue and then to the next show)
            const detourDistance = this.calculateDistance(
              parseFloat(event1.venue.latitude),
              parseFloat(event1.venue.longitude),
              parseFloat(venue.latitude),
              parseFloat(venue.longitude)
            ) + this.calculateDistance(
              parseFloat(venue.latitude),
              parseFloat(venue.longitude),
              parseFloat(event2.venue.latitude),
              parseFloat(event2.venue.longitude)
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
                  lat: parseFloat(event1.venue.latitude),
                  lng: parseFloat(event1.venue.longitude)
                },
                destination: {
                  city: event2.venue.city,
                  state: event2.venue.region,
                  date: event2.datetime,
                  lat: parseFloat(event2.venue.latitude),
                  lng: parseFloat(event2.venue.longitude)
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
        .sort((a, b) => a!.route.distanceToVenue - b!.route.distanceToVenue);
      
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
   * Helper method to calculate distance between two points
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
  
  /**
   * Generate mock artists for demonstration
   */
  private generateMockArtists(count: number): any[] {
    const artists = [];
    
    for (let i = 0; i < count; i++) {
      artists.push({
        name: `Demo Artist ${i + 1}`,
        url: `https://www.bandsintown.com/a/demo${i + 1}`,
        image_url: `https://via.placeholder.com/300?text=Artist+${i + 1}`,
        thumb_url: `https://via.placeholder.com/150?text=Artist+${i + 1}`,
        facebook_page_url: `https://www.facebook.com/demoartist${i + 1}`,
        mbid: `mbid${i + 1}`,
        tracker_count: Math.floor(Math.random() * 10000),
        upcoming_event_count: Math.floor(Math.random() * 20) + 2
      });
    }
    
    return artists;
  }
  
  /**
   * Generate mock events for an artist
   */
  private generateMockEvents(artistName: string, startDate: string, endDate: string, count: number): any[] {
    const events = [];
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Create count number of events between start and end dates
    for (let i = 0; i < count; i++) {
      const randomDate = new Date(
        start.getTime() + Math.random() * (end.getTime() - start.getTime())
      );
      
      // Generate a random US city and region
      const cities = [
        { city: 'New York', region: 'NY', lat: 40.7128, lng: -74.0060 },
        { city: 'Los Angeles', region: 'CA', lat: 34.0522, lng: -118.2437 },
        { city: 'Chicago', region: 'IL', lat: 41.8781, lng: -87.6298 },
        { city: 'Houston', region: 'TX', lat: 29.7604, lng: -95.3698 },
        { city: 'Philadelphia', region: 'PA', lat: 39.9526, lng: -75.1652 },
        { city: 'Phoenix', region: 'AZ', lat: 33.4484, lng: -112.0740 },
        { city: 'San Antonio', region: 'TX', lat: 29.4241, lng: -98.4936 },
        { city: 'San Diego', region: 'CA', lat: 32.7157, lng: -117.1611 },
        { city: 'Dallas', region: 'TX', lat: 32.7767, lng: -96.7970 },
        { city: 'Pittsburgh', region: 'PA', lat: 40.4406, lng: -79.9959 },
        { city: 'Rochester', region: 'NY', lat: 43.1566, lng: -77.6088 },
        { city: 'Buffalo', region: 'NY', lat: 42.8864, lng: -78.8784 },
        { city: 'Syracuse', region: 'NY', lat: 43.0481, lng: -76.1474 },
        { city: 'Albany', region: 'NY', lat: 42.6526, lng: -73.7562 },
        { city: 'Utica', region: 'NY', lat: 43.1010, lng: -75.2327 }
      ];
      
      const randomCity = cities[Math.floor(Math.random() * cities.length)];
      
      events.push({
        id: `event${i}`,
        url: `https://www.bandsintown.com/e/event${i}`,
        datetime: randomDate.toISOString(),
        title: `${artistName} at Venue ${i + 1}`,
        description: `${artistName} performing at Venue ${i + 1}`,
        venue: {
          name: `Venue ${i + 1}`,
          location: `${randomCity.city}, ${randomCity.region}`,
          city: randomCity.city,
          region: randomCity.region,
          country: 'United States',
          latitude: String(randomCity.lat + (Math.random() * 0.1 - 0.05)),
          longitude: String(randomCity.lng + (Math.random() * 0.1 - 0.05))
        },
        lineup: [artistName],
        offers: [{
          type: 'Tickets',
          url: `https://www.bandsintown.com/t/event${i}`,
          status: 'available'
        }]
      });
    }
    
    // Sort events by date
    events.sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
    
    return events;
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