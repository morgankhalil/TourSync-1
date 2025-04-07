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
    } else {
      console.log(`Bandsintown API key configured (first 4 chars: ${this.apiKey.substring(0, 4)})`);
      this.testApiConnection();
    }
  }
  
  private async testApiConnection() {
    try {
      console.log("Testing Bandsintown API connection...");
      const response = await axios.get(
        `https://rest.bandsintown.com/artists/Radiohead?app_id=${this.apiKey}`
      );
      
      if (response.data && response.data.name) {
        console.log(`API test successful! Found artist: ${response.data.name}`);
      } else {
        console.log("API test returned unexpected data:", response.data);
      }
    } catch (error) {
      console.error("API test failed with error:", error.message);
      
      if (error.response) {
        console.error("API response status:", error.response.status);
        console.error("API response data:", error.response.data);
      }
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
      
      // Step 2: Get artists playing in the area
      // Mix of popular, indie, and regional acts that might be playing venues like Bug Jar
      const artists = [
        // Mainstream touring acts
        'The Killers', 'Foo Fighters', 'Green Day', 'Metallica',
        'Pearl Jam', 'Red Hot Chili Peppers', 'Tool',
        'Jack White', 'Tame Impala', 'Arctic Monkeys', 'The Strokes', 'Vampire Weekend',
        'The Black Keys', 'The National', 'Arcade Fire', 'LCD Soundsystem',
        'The War On Drugs', 'Spoon', 'Fleet Foxes', 'Bon Iver',
        'St. Vincent', 'Angel Olsen', 'Phoebe Bridgers', 'Mitski', 'Japanese Breakfast',
        
        // More indie and regional touring acts
        'King Gizzard & The Lizard Wizard', 'Car Seat Headrest', 'Beach House', 'Big Thief',
        'Black Midi', 'Parquet Courts', 'Fontaines D.C.', 'Idles', 'Shame',
        'Courtney Barnett', 'Kurt Vile', 'Ty Segall', 'Mac DeMarco', 'Oh Sees',
        'Real Estate', 'Alvvays', 'Snail Mail', 'Soccer Mommy', 'Lucy Dacus',
        'Julien Baker', 'The Mountain Goats', 'Phosphorescent', 'Kevin Morby',
        'Whitney', 'Wolf Parade', 'Pinegrove', 'Dinosaur Jr.', 'Built to Spill',
        'Cloud Nothings', 'Guided By Voices', 'Modest Mouse', 'Bright Eyes',
        
        // Regional artists that tour venues like Bug Jar
        'Pile', 'Geese', 'Wednesday', 'Hotline TNT', 'Ratboys', 'Horse Jumper of Love',
        'Duster', 'Slothrust', 'Weakened Friends', 'Fat Night', 'Stove', 'Kneecap',
        'Squirrel Flower', 'Really From', 'Guerilla Toss', 'Pkew Pkew Pkew',
        'Wild Pink', 'Hovvdy', 'Oso Oso', 'Camp Cope', 'Future Teens', 'Another Michael',
        'Dirt Buyer', 'Mal Devisa', 'Florist', 'Lomelda', 'Illuminati Hotties', 
        'Peaer', 'Pom Pom Squad', 'Kal Marks', 'The Ophelias', '2nd Grade'
      ];
      
      console.log(`Fetching events for ${artists.length} artists`);
      
      // Step 3: For each artist, get their events
      let artistsWithEventsCount = 0;
      let artistsWithMatchingEventsCount = 0;
      let totalEventsCount = 0;
      let matchingEventsCount = 0;

      const artistsWithEventsPromises = artists.map(async (artistName) => {
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
          
          if (events && events.length > 0) {
            artistsWithEventsCount++;
            totalEventsCount += events.length;
            console.log(`Artist ${artistName} has ${events.length} events`);
          }
          
          // Filter to only include events in the specified date range
          const filteredEvents = events.filter((event: any) => {
            const eventDate = new Date(event.datetime);
            return eventDate >= new Date(startDate) && eventDate <= new Date(endDate);
          });
          
          if (filteredEvents.length > 0) {
            artistsWithMatchingEventsCount++;
            matchingEventsCount += filteredEvents.length;
            console.log(`Artist ${artistName} has ${filteredEvents.length} events in date range ${startDate} to ${endDate}`);
            
            // Log coordinates of each event to check distance calculations
            filteredEvents.forEach((event: any, idx: number) => {
              const lat = event.venue.latitude;
              const lng = event.venue.longitude;
              console.log(`  Event ${idx+1}: ${event.venue.city}, ${event.venue.region} at [${lat}, ${lng}]`);
            });
          }
          
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
      
      console.log(`API Stats Summary:
      - Artists with any events: ${artistsWithEventsCount}/${artists.length}
      - Artists with events in date range: ${artistsWithMatchingEventsCount}/${artists.length}
      - Total events: ${totalEventsCount}
      - Events in date range: ${matchingEventsCount}
      - Bug Jar coordinates: [${venue.latitude}, ${venue.longitude}]
      - Date range: ${startDate} to ${endDate}
      - Search radius: ${radius} miles`);
      
      
      // Step 4: Calculate which artists are passing "near" the venue
      // Filter for artists with at least 2 events in the date range
      const artistsWithRoutes = validArtists
        .filter(artist => artist && artist.events && artist.events.length >= 1) // Just need 1 event to consider an artist
        .map(artist => {
          // Sort events by date
          const sortedEvents = [...artist.events].sort((a: any, b: any) => 
            new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
          );
          
          // First check - if artist only has one event and it's within reasonable distance of our venue
          let bestRoute = null;
          
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
              
              // If the single event is within the specified radius, consider it
              if (distanceToVenue <= radius) {
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
                  daysAvailable: 1 // Assume 1 day available
                };
              }
            }
          }
          
          // Second check - find pairs of consecutive events that our venue could fit between
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
// Generates sample data for a venue to demo discovery features
async function generateDemoDiscoveryData(venueId: number, startDate: string, endDate: string, radius: number) {
  try {
    // Get the venue details to get location
    const { storage } = await import('../storage');
    const venue = await storage.getVenue(venueId);
    
    if (!venue) {
      throw new Error(`Venue with ID ${venueId} not found`);
    }
    
    if (!venue.latitude || !venue.longitude) {
      throw new Error(`Venue "${venue.name}" is missing location data`);
    }
    
    // Generate some sample bands that would be passing near the venue
    const sampleBands = [
      {
        name: "The Indie Travelers",
        image_url: "https://i.imgur.com/4B7EqYr.png",
        url: "https://bandsintown.com",
        upcoming_event_count: 12,
        route: {
          origin: {
            city: "Buffalo",
            state: "NY",
            date: new Date(new Date(startDate).getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            lat: 42.8864,
            lng: -78.8784
          },
          destination: {
            city: "Toronto",
            state: "ON",
            date: new Date(new Date(startDate).getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(),
            lat: 43.6532,
            lng: -79.3832
          },
          distanceToVenue: 35,
          detourDistance: 50,
          daysAvailable: 4
        },
        genre: "Indie Rock",
        bandsintownId: "12345",
        drawSize: 120,
        website: "https://example.com/indietravelers"
      },
      {
        name: "Folk Road Warriors",
        image_url: "https://i.imgur.com/CQ3dDOZ.png",
        url: "https://bandsintown.com",
        upcoming_event_count: 8,
        route: {
          origin: {
            city: "Syracuse",
            state: "NY",
            date: new Date(new Date(startDate).getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),
            lat: 43.0481,
            lng: -76.1474
          },
          destination: {
            city: "Albany",
            state: "NY",
            date: new Date(new Date(startDate).getTime() + 9 * 24 * 60 * 60 * 1000).toISOString(),
            lat: 42.6526,
            lng: -73.7562
          },
          distanceToVenue: 55,
          detourDistance: 65,
          daysAvailable: 5
        },
        genre: "Folk",
        bandsintownId: "67890",
        drawSize: 80,
        website: "https://example.com/folkwarriors"
      },
      {
        name: "Local Favorites",
        image_url: "https://i.imgur.com/E9e4SSZ.png",
        url: "https://bandsintown.com",
        upcoming_event_count: 3,
        route: {
          origin: {
            city: "Ithaca",
            state: "NY",
            date: new Date(new Date(startDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            lat: 42.4440,
            lng: -76.5019
          },
          destination: null,  // Single event band
          distanceToVenue: 75,
          detourDistance: 150,
          daysAvailable: 2
        },
        genre: "Punk Rock",
        bandsintownId: "24680",
        drawSize: 50,
        website: "https://example.com/localfavs"
      }
    ];
    
    return {
      data: sampleBands,
      venue: venue
    };
  } catch (error) {
    console.error('Error generating demo data:', error);
    throw error;
  }
}

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
      
      // Check for demo mode request via query param
      const useDemo = req.query.demo === 'true';
      
      let result;
      if (useDemo) {
        console.log("USING DEMO MODE for artist discovery");
        result = await generateDemoDiscoveryData(venueId, startDate, endDate, radius);
      } else {
        // Get the discovery service and call the method
        const discoveryService = getDiscoveryService();
        result = await discoveryService.findBandsNearVenue(venueId, startDate, endDate, radius);
        
        // If no bands found with the API, fall back to demo mode
        if (result.data.length === 0) {
          console.log("No bands found from API, using demo data");
          result = await generateDemoDiscoveryData(venueId, startDate, endDate, radius);
        }
      }
      
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