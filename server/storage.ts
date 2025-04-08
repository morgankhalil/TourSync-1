import { Artist, InsertArtist, ArtistDiscovery, InsertArtistDiscovery, 
  Event, InsertEvent, CollaborationRequest, InsertCollaborationRequest,
  ArtistCompatibility, InsertArtistCompatibility,
  Venue, InsertVenue,
  artists, artistDiscovery, events, collaborationRequests, artistCompatibility, venues
} from '@shared/schema';
import { db } from './db';
import { eq, and, inArray, gte, lte } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// Calculate similarity between two artists based on genres
function calculateGenreSimilarity(genres1: string[], genres2: string[]): number {
  if (!genres1.length || !genres2.length) return 0;
  
  const set1 = new Set(genres1);
  const set2 = new Set(genres2);
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  
  // Jaccard similarity coefficient
  return intersection.size / (set1.size + set2.size - intersection.size);
}

// Calculate distance between two points using Haversine formula (returns distance in miles)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth's radius in miles (rather than 6371 km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export interface IStorage {
  // Artist operations
  getArtist(id: string): Promise<Artist | undefined>;
  getArtists(options?: { limit?: number; genres?: string[] }): Promise<Artist[]>;
  createArtist(artist: InsertArtist): Promise<Artist>;
  updateArtist(id: string, artist: Partial<InsertArtist>): Promise<Artist | undefined>;
  deleteArtist(id: string): Promise<boolean>;
  
  // Artist discovery tracking
  getArtistDiscovery(artistId: string): Promise<ArtistDiscovery | undefined>;
  recordArtistDiscovery(discovery: InsertArtistDiscovery): Promise<ArtistDiscovery>;
  updateArtistDiscovery(artistId: string, discovery: Partial<InsertArtistDiscovery>): Promise<ArtistDiscovery | undefined>;
  
  // Venue operations
  getVenue(id: number): Promise<Venue | undefined>;
  getVenues(options?: { limit?: number; city?: string }): Promise<Venue[]>;
  getVenuesNear(options: { latitude: string; longitude: string; radiusMiles: number; limit?: number }): Promise<Venue[]>;
  createVenue(venue: InsertVenue): Promise<Venue>;
  updateVenue(id: number, venue: Partial<InsertVenue>): Promise<Venue | undefined>;
  deleteVenue(id: number): Promise<boolean>;
  
  // Event operations
  getEvent(id: string): Promise<Event | undefined>;
  getEventsByArtist(artistId: string): Promise<Event[]>;
  getEventsInDateRange(startDate: Date, endDate: Date): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>;
  
  // Collaboration request operations
  getCollaborationRequest(id: number): Promise<CollaborationRequest | undefined>;
  getCollaborationRequestsByArtist(artistId: string, isReceiving?: boolean): Promise<CollaborationRequest[]>;
  createCollaborationRequest(request: InsertCollaborationRequest): Promise<CollaborationRequest>;
  updateCollaborationRequest(id: number, request: Partial<InsertCollaborationRequest>): Promise<CollaborationRequest | undefined>;
  deleteCollaborationRequest(id: number): Promise<boolean>;
  
  // Artist compatibility operations
  getArtistCompatibility(artistId1: string, artistId2: string): Promise<ArtistCompatibility | undefined>;
  getCompatibleArtists(artistId: string, minScore?: number): Promise<{ artist: Artist; compatibility: ArtistCompatibility }[]>;
  calculateAndStoreCompatibility(artistId1: string, artistId2: string): Promise<ArtistCompatibility>;
  
  // Specialized operations
  findArtistsNearLocation(lat: number, lng: number, radius: number, date?: Date): Promise<{ artist: Artist; event: Event; distance: number }[]>;
  findCollaborationOpportunities(artistId: string, maxDistance?: number): Promise<{ artist: Artist; event: Event; compatibility?: number; distance: number }[]>;
  getArtistStatistics(artistId: string): Promise<{ 
    upcomingEvents: number;
    collaborationRequests: number;
    pendingRequests: number;
    totalCompatibleArtists: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Artist operations
  async getArtist(id: string): Promise<Artist | undefined> {
    const result = await db.select().from(artists).where(eq(artists.id, id));
    return result[0];
  }

  async getArtists(options?: { limit?: number; genres?: string[] }): Promise<Artist[]> {
    try {
      // First fetch all artists
      const allArtists = await db.select().from(artists);
      
      // Filter by genres if provided
      let filteredArtists = allArtists;
      if (options?.genres && options.genres.length > 0) {
        filteredArtists = allArtists.filter(artist => {
          if (!artist.genres || !artist.genres.length) return false;
          return options.genres!.some(genre => artist.genres!.includes(genre));
        });
      }
      
      // Apply limit if provided
      if (options?.limit && options.limit > 0) {
        return filteredArtists.slice(0, options.limit);
      }
      
      return filteredArtists;
    } catch (error) {
      console.error("Error in getArtists:", error);
      return [];
    }
  }

  async createArtist(artist: InsertArtist): Promise<Artist> {
    const id = artist.id || uuidv4();
    const newArtist = { ...artist, id };
    
    const result = await db.insert(artists).values(newArtist).returning();
    return result[0];
  }

  async updateArtist(id: string, artist: Partial<InsertArtist>): Promise<Artist | undefined> {
    const result = await db.update(artists)
      .set(artist)
      .where(eq(artists.id, id))
      .returning();
    
    return result[0];
  }

  async deleteArtist(id: string): Promise<boolean> {
    const result = await db.delete(artists).where(eq(artists.id, id));
    return !!result;
  }

  // Artist discovery tracking
  async getArtistDiscovery(artistId: string): Promise<ArtistDiscovery | undefined> {
    const result = await db.select().from(artistDiscovery).where(eq(artistDiscovery.artistId, artistId));
    return result[0];
  }

  async recordArtistDiscovery(discovery: InsertArtistDiscovery): Promise<ArtistDiscovery> {
    const result = await db.insert(artistDiscovery).values(discovery).returning();
    return result[0];
  }

  async updateArtistDiscovery(artistId: string, discovery: Partial<InsertArtistDiscovery>): Promise<ArtistDiscovery | undefined> {
    const result = await db.update(artistDiscovery)
      .set(discovery)
      .where(eq(artistDiscovery.artistId, artistId))
      .returning();
    
    return result[0];
  }

  // Event operations
  async getEvent(id: string): Promise<Event | undefined> {
    const result = await db.select().from(events).where(eq(events.id, id));
    return result[0];
  }

  async getEventsByArtist(artistId: string): Promise<Event[]> {
    return db.select().from(events).where(eq(events.artistId, artistId));
  }

  async getEventsInDateRange(startDate: Date, endDate: Date): Promise<Event[]> {
    return db.select().from(events)
      .where(and(
        gte(events.eventDate, startDate),
        lte(events.eventDate, endDate)
      ));
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const id = event.id || uuidv4();
    const newEvent = { ...event, id };
    
    const result = await db.insert(events).values(newEvent).returning();
    return result[0];
  }

  async updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined> {
    const result = await db.update(events)
      .set(event)
      .where(eq(events.id, id))
      .returning();
    
    return result[0];
  }

  async deleteEvent(id: string): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id));
    return !!result;
  }

  // Collaboration request operations
  async getCollaborationRequest(id: number): Promise<CollaborationRequest | undefined> {
    const result = await db.select().from(collaborationRequests).where(eq(collaborationRequests.id, id));
    return result[0];
  }

  async getCollaborationRequestsByArtist(artistId: string, isReceiving: boolean = false): Promise<CollaborationRequest[]> {
    if (isReceiving) {
      return db.select().from(collaborationRequests).where(eq(collaborationRequests.receivingArtistId, artistId));
    } else {
      return db.select().from(collaborationRequests).where(eq(collaborationRequests.requestingArtistId, artistId));
    }
  }

  async createCollaborationRequest(request: InsertCollaborationRequest): Promise<CollaborationRequest> {
    const result = await db.insert(collaborationRequests).values(request).returning();
    return result[0];
  }

  async updateCollaborationRequest(id: number, request: Partial<InsertCollaborationRequest>): Promise<CollaborationRequest | undefined> {
    const result = await db.update(collaborationRequests)
      .set(request)
      .where(eq(collaborationRequests.id, id))
      .returning();
    
    return result[0];
  }

  async deleteCollaborationRequest(id: number): Promise<boolean> {
    const result = await db.delete(collaborationRequests).where(eq(collaborationRequests.id, id));
    return !!result;
  }

  // Artist compatibility operations
  async getArtistCompatibility(artistId1: string, artistId2: string): Promise<ArtistCompatibility | undefined> {
    // Make sure the artist IDs are in a consistent order
    const [first, second] = artistId1 < artistId2 ? [artistId1, artistId2] : [artistId2, artistId1];
    
    const result = await db.select().from(artistCompatibility).where(
      and(
        eq(artistCompatibility.artistId1, first),
        eq(artistCompatibility.artistId2, second)
      )
    );
    
    return result[0];
  }

  async getCompatibleArtists(artistId: string, minScore: number = 50): Promise<{ artist: Artist; compatibility: ArtistCompatibility }[]> {
    // Need to query compatibility in both directions (as artistId1 or artistId2)
    const asId1 = await db.select()
      .from(artistCompatibility)
      .where(and(
        eq(artistCompatibility.artistId1, artistId),
        gte(artistCompatibility.compatibilityScore, minScore)
      ));
    
    const asId2 = await db.select()
      .from(artistCompatibility)
      .where(and(
        eq(artistCompatibility.artistId2, artistId),
        gte(artistCompatibility.compatibilityScore, minScore)
      ));
    
    // Collect all unique artist IDs
    const compatibilities = [...asId1, ...asId2];
    const otherArtistIds = compatibilities.map(c => 
      c.artistId1 === artistId ? c.artistId2 : c.artistId1
    );
    
    if (otherArtistIds.length === 0) return [];
    
    // Get all artist details
    const otherArtists = await db.select()
      .from(artists)
      .where(inArray(artists.id, otherArtistIds));
    
    // Map artists to their compatibility scores
    return otherArtists.map(artist => {
      const compatibility = compatibilities.find(c => 
        c.artistId1 === artist.id || c.artistId2 === artist.id
      )!;
      
      return { artist, compatibility };
    });
  }

  async calculateAndStoreCompatibility(artistId1: string, artistId2: string): Promise<ArtistCompatibility> {
    // Make sure the artist IDs are in a consistent order
    const [first, second] = artistId1 < artistId2 ? [artistId1, artistId2] : [artistId2, artistId1];
    
    // Get both artists
    const artist1 = await this.getArtist(first);
    const artist2 = await this.getArtist(second);
    
    if (!artist1 || !artist2) {
      throw new Error("One or both artists not found");
    }
    
    // Calculate genre overlap
    const genreOverlap = Math.round(calculateGenreSimilarity(
      artist1.genres || [], 
      artist2.genres || []
    ) * 100);
    
    // Calculate audience match (currently based on draw size)
    let audienceMatch = 50; // Default medium match
    
    // If both have audience draw size, calculate match
    if (artist1.drawSize && artist2.drawSize) {
      // Formula to calculate percentage similarity (1 - normalized difference)
      // A value of 0 means completely different, 1 means identical
      const maxDrawSize = Math.max(artist1.drawSize, artist2.drawSize);
      const minDrawSize = Math.min(artist1.drawSize, artist2.drawSize);
      
      if (maxDrawSize > 0) {
        // Formula produces values between 0-1, multiply by 100 for percentage
        audienceMatch = Math.round((minDrawSize / maxDrawSize) * 100);
      }
    }
    
    // Overall compatibility - weight genre more heavily
    const compatibilityScore = Math.round((genreOverlap * 0.7) + (audienceMatch * 0.3));
    
    // Create or update compatibility record
    const existingCompat = await this.getArtistCompatibility(first, second);
    
    if (existingCompat) {
      // Update existing record
      return (await db.update(artistCompatibility)
        .set({
          compatibilityScore,
          genreOverlap,
          audienceMatch,
          updatedAt: new Date()
        })
        .where(and(
          eq(artistCompatibility.artistId1, first),
          eq(artistCompatibility.artistId2, second)
        ))
        .returning())[0];
    } else {
      // Insert new record
      return (await db.insert(artistCompatibility)
        .values({
          artistId1: first,
          artistId2: second,
          compatibilityScore,
          genreOverlap,
          audienceMatch
        })
        .returning())[0];
    }
  }

  // Specialized operations
  async findArtistsNearLocation(
    lat: number, 
    lng: number, 
    radius: number, 
    date?: Date
  ): Promise<{ artist: Artist; event: Event; distance: number }[]> {
    // Get all events (we'll filter by distance client-side for now)
    let allEvents = await db.select().from(events);
    
    // Filter by date if provided
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      allEvents = allEvents.filter(event => {
        const eventDate = new Date(event.eventDate);
        return eventDate >= startDate && eventDate <= endDate;
      });
    }
    
    // Calculate distance for each event
    const eventsWithDistance = allEvents.map(event => {
      const eventLat = parseFloat(event.latitude);
      const eventLng = parseFloat(event.longitude);
      const distance = calculateDistance(lat, lng, eventLat, eventLng);
      
      return { event, distance };
    });
    
    // Filter by radius
    const eventsInRadius = eventsWithDistance.filter(({ distance }) => distance <= radius);
    
    // Early return if no events
    if (eventsInRadius.length === 0) return [];
    
    // Get all relevant artists
    const artistIds = [...new Set(eventsInRadius.map(({ event }) => event.artistId))];
    const allArtists = await db.select().from(artists).where(inArray(artists.id, artistIds));
    
    // Map to the expected return format
    return eventsInRadius.map(({ event, distance }) => {
      const artist = allArtists.find(a => a.id === event.artistId)!;
      return { artist, event, distance };
    });
  }

  async findCollaborationOpportunities(
    artistId: string, 
    maxDistance: number = 100
  ): Promise<{ artist: Artist; event: Event; compatibility?: number; distance: number }[]> {
    // Get the artist's events first
    const artistEvents = await this.getEventsByArtist(artistId);
    
    if (artistEvents.length === 0) {
      return []; // No events to compare against
    }
    
    // Get all other artists' events
    const allEvents = await db.select().from(events).where(
      and(
        eq(events.collaborationOpen, true),
        lte(events.eventDate, new Date())
      )
    );
    
    // Filter out this artist's events
    const otherEvents = allEvents.filter(event => event.artistId !== artistId);
    
    // Calculate opportunities
    const opportunities: { 
      artist: Artist; 
      event: Event; 
      compatibility?: number; 
      distance: number 
    }[] = [];
    
    // For each artist event, find nearby other events
    for (const artistEvent of artistEvents) {
      const artistLat = parseFloat(artistEvent.latitude);
      const artistLng = parseFloat(artistEvent.longitude);
      
      // Calculate distance to all other events
      for (const otherEvent of otherEvents) {
        const otherLat = parseFloat(otherEvent.latitude);
        const otherLng = parseFloat(otherEvent.longitude);
        
        const distance = calculateDistance(artistLat, artistLng, otherLat, otherLng);
        
        // Check if within range
        if (distance <= maxDistance) {
          // Get the other artist
          const otherArtist = await this.getArtist(otherEvent.artistId);
          
          if (otherArtist) {
            // Get compatibility if available
            let compatibility: number | undefined;
            try {
              const compatRecord = await this.getArtistCompatibility(artistId, otherArtist.id);
              compatibility = compatRecord?.compatibilityScore;
            } catch (error) {
              // Compatibility not calculated yet, leave undefined
            }
            
            opportunities.push({
              artist: otherArtist,
              event: otherEvent,
              compatibility,
              distance
            });
          }
        }
      }
    }
    
    // Sort by compatibility (if available) and distance
    return opportunities.sort((a, b) => {
      // If both have compatibility scores, sort by that first
      if (a.compatibility !== undefined && b.compatibility !== undefined) {
        if (a.compatibility !== b.compatibility) {
          return b.compatibility - a.compatibility; // Higher compatibility first
        }
      }
      
      // Otherwise, sort by distance
      return a.distance - b.distance; // Closer first
    });
  }

  async getArtistStatistics(artistId: string): Promise<{ 
    upcomingEvents: number;
    collaborationRequests: number;
    pendingRequests: number;
    totalCompatibleArtists: number;
  }> {
    // Get upcoming events count
    const now = new Date();
    const artistEvents = await db.select().from(events)
      .where(and(
        eq(events.artistId, artistId),
        gte(events.eventDate, now)
      ));
    
    // Get collaboration requests count
    const receivedRequests = await db.select().from(collaborationRequests)
      .where(eq(collaborationRequests.receivingArtistId, artistId));
    
    const sentRequests = await db.select().from(collaborationRequests)
      .where(eq(collaborationRequests.requestingArtistId, artistId));
    
    // Get pending requests count
    const pendingRequests = receivedRequests.filter(req => req.status === 'pending');
    
    // Get compatible artists count
    const compatibleArtists = await this.getCompatibleArtists(artistId, 50); // 50% compatibility threshold
    
    return {
      upcomingEvents: artistEvents.length,
      collaborationRequests: receivedRequests.length + sentRequests.length,
      pendingRequests: pendingRequests.length,
      totalCompatibleArtists: compatibleArtists.length
    };
  }

  // Venue operations
  async getVenue(id: number): Promise<Venue | undefined> {
    try {
      const result = await db.select().from(venues).where(eq(venues.id, id));
      return result[0];
    } catch (error) {
      console.error('Error in getVenue:', error);
      return undefined;
    }
  }

  async getVenues(options?: { limit?: number; city?: string }): Promise<Venue[]> {
    try {
      let query = db.select().from(venues);
    
      // Filter by city if provided
      if (options?.city) {
        query = query.where(eq(venues.city, options.city));
      }
    
      let results = await query;
    
      // Apply limit if provided
      if (options?.limit && options.limit > 0 && results.length > options.limit) {
        results = results.slice(0, options.limit);
      }
    
      return results;
    } catch (error) {
      console.error('Error in getVenues:', error);
      return [];
    }
  }

  async createVenue(venue: InsertVenue): Promise<Venue> {
    try {
      const result = await db.insert(venues).values(venue).returning();
      return result[0];
    } catch (error) {
      console.error('Error in createVenue:', error);
      throw error;
    }
  }

  async updateVenue(id: number, venue: Partial<InsertVenue>): Promise<Venue | undefined> {
    try {
      const result = await db.update(venues)
        .set(venue)
        .where(eq(venues.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error('Error in updateVenue:', error);
      return undefined;
    }
  }

  async deleteVenue(id: number): Promise<boolean> {
    try {
      const result = await db.delete(venues).where(eq(venues.id, id));
      return !!result;
    } catch (error) {
      console.error('Error in deleteVenue:', error);
      return false;
    }
  }
  
  async getVenuesNear(options: { latitude: string; longitude: string; radiusMiles: number; limit?: number }): Promise<Venue[]> {
    // Get all venues from database
    const allVenues = await db.select().from(venues);
    
    // Convert coordinates to numbers
    const lat = parseFloat(options.latitude);
    const lng = parseFloat(options.longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      throw new Error("Invalid coordinates");
    }
    
    // Calculate distance for each venue and filter
    const venuesWithDistance = allVenues
      .map(venue => {
        // Skip venues without coordinates
        if (!venue.latitude || !venue.longitude) return { venue, distance: Infinity };
        
        const venueLat = parseFloat(venue.latitude);
        const venueLng = parseFloat(venue.longitude);
        
        if (isNaN(venueLat) || isNaN(venueLng)) return { venue, distance: Infinity };
        
        const distance = calculateDistance(lat, lng, venueLat, venueLng);
        return { venue, distance };
      })
      .filter(item => item.distance <= options.radiusMiles)
      .sort((a, b) => a.distance - b.distance); // Sort by closest first
    
    // Apply limit if provided
    const limitedResults = options.limit ? venuesWithDistance.slice(0, options.limit) : venuesWithDistance;
    
    // Return just the venues without the distance
    return limitedResults.map(item => item.venue);
  }
}

// Create a simple in-memory implementation for testing
export class MemStorage implements IStorage {
  private artistsData: Map<string, Artist> = new Map();
  private artistDiscoveryData: Map<string, ArtistDiscovery> = new Map();
  private eventsData: Map<string, Event> = new Map();
  private collaborationRequestsData: Map<number, CollaborationRequest> = new Map();
  private artistCompatibilityData: Map<string, ArtistCompatibility> = new Map();
  private venuesData: Map<number, Venue> = new Map();
  private collaborationRequestIdCounter: number = 1;

  constructor() {
    // We'll always initialize with sample data for now
    // since this code is run before server/index.ts can set the env variable
    console.log('Initializing MemStorage...');
    this.initializeSampleData();
  }

  // Artist operations
  async getArtist(id: string): Promise<Artist | undefined> {
    return this.artistsData.get(id);
  }

  async getArtists(options?: { limit?: number; genres?: string[] }): Promise<Artist[]> {
    let artists = Array.from(this.artistsData.values());
    
    // Filter by genres if provided
    if (options?.genres && options.genres.length > 0) {
      artists = artists.filter(artist => {
        if (!artist.genres || !artist.genres.length) return false;
        return options.genres!.some(genre => artist.genres!.includes(genre));
      });
    }
    
    // Apply limit if provided
    if (options?.limit && options.limit > 0) {
      artists = artists.slice(0, options.limit);
    }
    
    return artists;
  }

  async createArtist(artist: InsertArtist): Promise<Artist> {
    const id = artist.id || uuidv4();
    const newArtist: Artist = { 
      ...artist, 
      id, 
      createdAt: new Date()
    };
    
    this.artistsData.set(id, newArtist);
    return newArtist;
  }

  async updateArtist(id: string, artist: Partial<InsertArtist>): Promise<Artist | undefined> {
    const existingArtist = this.artistsData.get(id);
    if (!existingArtist) return undefined;
    
    const updatedArtist = { ...existingArtist, ...artist };
    this.artistsData.set(id, updatedArtist);
    
    return updatedArtist;
  }

  async deleteArtist(id: string): Promise<boolean> {
    return this.artistsData.delete(id);
  }

  // Artist discovery tracking
  async getArtistDiscovery(artistId: string): Promise<ArtistDiscovery | undefined> {
    return this.artistDiscoveryData.get(artistId);
  }

  async recordArtistDiscovery(discovery: InsertArtistDiscovery): Promise<ArtistDiscovery> {
    this.artistDiscoveryData.set(discovery.artistId, discovery);
    return discovery;
  }

  async updateArtistDiscovery(artistId: string, discovery: Partial<InsertArtistDiscovery>): Promise<ArtistDiscovery | undefined> {
    const existing = this.artistDiscoveryData.get(artistId);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...discovery };
    this.artistDiscoveryData.set(artistId, updated);
    
    return updated;
  }

  // Event operations
  async getEvent(id: string): Promise<Event | undefined> {
    return this.eventsData.get(id);
  }

  async getEventsByArtist(artistId: string): Promise<Event[]> {
    return Array.from(this.eventsData.values())
      .filter(event => event.artistId === artistId);
  }

  async getEventsInDateRange(startDate: Date, endDate: Date): Promise<Event[]> {
    return Array.from(this.eventsData.values())
      .filter(event => {
        const eventDate = new Date(event.eventDate);
        return eventDate >= startDate && eventDate <= endDate;
      });
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const id = event.id || uuidv4();
    const newEvent: Event = {
      ...event,
      id,
      createdAt: new Date()
    };
    
    this.eventsData.set(id, newEvent);
    return newEvent;
  }

  async updateEvent(id: string, event: Partial<InsertEvent>): Promise<Event | undefined> {
    const existing = this.eventsData.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...event };
    this.eventsData.set(id, updated);
    
    return updated;
  }

  async deleteEvent(id: string): Promise<boolean> {
    return this.eventsData.delete(id);
  }

  // Collaboration request operations
  async getCollaborationRequest(id: number): Promise<CollaborationRequest | undefined> {
    return this.collaborationRequestsData.get(id);
  }

  async getCollaborationRequestsByArtist(artistId: string, isReceiving: boolean = false): Promise<CollaborationRequest[]> {
    return Array.from(this.collaborationRequestsData.values())
      .filter(req => isReceiving 
        ? req.receivingArtistId === artistId 
        : req.requestingArtistId === artistId
      );
  }

  async createCollaborationRequest(request: InsertCollaborationRequest): Promise<CollaborationRequest> {
    const id = this.collaborationRequestIdCounter++;
    const newRequest: CollaborationRequest = {
      ...request,
      id,
      requestDate: new Date(),
      responseDate: undefined
    };
    
    this.collaborationRequestsData.set(id, newRequest);
    return newRequest;
  }

  async updateCollaborationRequest(id: number, request: Partial<InsertCollaborationRequest>): Promise<CollaborationRequest | undefined> {
    const existing = this.collaborationRequestsData.get(id);
    if (!existing) return undefined;
    
    // If status is being changed from pending, set the response date
    if (request.status && request.status !== 'pending' && existing.status === 'pending') {
      existing.responseDate = new Date();
    }
    
    const updated = { ...existing, ...request };
    this.collaborationRequestsData.set(id, updated);
    
    return updated;
  }

  async deleteCollaborationRequest(id: number): Promise<boolean> {
    return this.collaborationRequestsData.delete(id);
  }

  // Artist compatibility operations
  async getArtistCompatibility(artistId1: string, artistId2: string): Promise<ArtistCompatibility | undefined> {
    // Make sure the artist IDs are in a consistent order
    const [first, second] = artistId1 < artistId2 ? [artistId1, artistId2] : [artistId2, artistId1];
    
    // Use composite key format
    const key = `${first}:${second}`;
    return this.artistCompatibilityData.get(key);
  }

  async getCompatibleArtists(artistId: string, minScore: number = 50): Promise<{ artist: Artist; compatibility: ArtistCompatibility }[]> {
    const compatibleArtists: { artist: Artist; compatibility: ArtistCompatibility }[] = [];
    
    // Check all compatibility records
    for (const [key, compatibility] of this.artistCompatibilityData.entries()) {
      // Parse the composite key
      const [id1, id2] = key.split(':');
      
      // Only process records involving this artist
      if (id1 === artistId || id2 === artistId) {
        // Only include if score meets minimum
        if (compatibility.compatibilityScore >= minScore) {
          // Get the other artist ID
          const otherArtistId = id1 === artistId ? id2 : id1;
          const otherArtist = this.artistsData.get(otherArtistId);
          
          if (otherArtist) {
            compatibleArtists.push({ artist: otherArtist, compatibility });
          }
        }
      }
    }
    
    return compatibleArtists;
  }

  async calculateAndStoreCompatibility(artistId1: string, artistId2: string): Promise<ArtistCompatibility> {
    // Make sure the artist IDs are in a consistent order
    const [first, second] = artistId1 < artistId2 ? [artistId1, artistId2] : [artistId2, artistId1];
    
    // Get both artists
    const artist1 = await this.getArtist(first);
    const artist2 = await this.getArtist(second);
    
    if (!artist1 || !artist2) {
      throw new Error("One or both artists not found");
    }
    
    // Calculate genre overlap
    const genreOverlap = Math.round(calculateGenreSimilarity(
      artist1.genres || [], 
      artist2.genres || []
    ) * 100);
    
    // Calculate audience match (based on draw size if available)
    let audienceMatch = 50; // Default medium match
    
    if (artist1.drawSize && artist2.drawSize) {
      const maxDrawSize = Math.max(artist1.drawSize, artist2.drawSize);
      const minDrawSize = Math.min(artist1.drawSize, artist2.drawSize);
      
      if (maxDrawSize > 0) {
        audienceMatch = Math.round((minDrawSize / maxDrawSize) * 100);
      }
    }
    
    // Overall compatibility - weight genre more heavily
    const compatibilityScore = Math.round((genreOverlap * 0.7) + (audienceMatch * 0.3));
    
    // Create compatibility record
    const compatibility: ArtistCompatibility = {
      artistId1: first,
      artistId2: second,
      compatibilityScore,
      genreOverlap,
      audienceMatch,
      updatedAt: new Date()
    };
    
    // Use composite key format
    const key = `${first}:${second}`;
    this.artistCompatibilityData.set(key, compatibility);
    
    return compatibility;
  }

  // Specialized operations
  async findArtistsNearLocation(
    lat: number, 
    lng: number, 
    radius: number, 
    date?: Date
  ): Promise<{ artist: Artist; event: Event; distance: number }[]> {
    // Get all events
    let allEvents = Array.from(this.eventsData.values());
    
    // Filter by date if provided
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      allEvents = allEvents.filter(event => {
        const eventDate = new Date(event.eventDate);
        return eventDate >= startDate && eventDate <= endDate;
      });
    }
    
    // Calculate distance for each event
    const results: { artist: Artist; event: Event; distance: number }[] = [];
    
    for (const event of allEvents) {
      const eventLat = parseFloat(event.latitude);
      const eventLng = parseFloat(event.longitude);
      
      const distance = calculateDistance(lat, lng, eventLat, eventLng);
      
      // Check if within radius
      if (distance <= radius) {
        const artist = this.artistsData.get(event.artistId);
        if (artist) {
          results.push({ artist, event, distance });
        }
      }
    }
    
    // Sort by distance
    return results.sort((a, b) => a.distance - b.distance);
  }

  async findCollaborationOpportunities(
    artistId: string, 
    maxDistance: number = 100
  ): Promise<{ artist: Artist; event: Event; compatibility?: number; distance: number }[]> {
    // Get the artist's events
    const artistEvents = await this.getEventsByArtist(artistId);
    
    if (artistEvents.length === 0) {
      return []; // No events to compare against
    }
    
    // Get all events with collaboration open
    const allEvents = Array.from(this.eventsData.values())
      .filter(event => 
        event.artistId !== artistId && 
        event.collaborationOpen && 
        new Date(event.eventDate) >= new Date()
      );
    
    // Calculate opportunities
    const opportunities: { 
      artist: Artist; 
      event: Event; 
      compatibility?: number; 
      distance: number 
    }[] = [];
    
    // For each artist event, find nearby other events
    for (const artistEvent of artistEvents) {
      const artistLat = parseFloat(artistEvent.latitude);
      const artistLng = parseFloat(artistEvent.longitude);
      
      // Check distance to all other events
      for (const otherEvent of allEvents) {
        const otherLat = parseFloat(otherEvent.latitude);
        const otherLng = parseFloat(otherEvent.longitude);
        
        const distance = calculateDistance(artistLat, artistLng, otherLat, otherLng);
        
        // Check if within range
        if (distance <= maxDistance) {
          const otherArtist = this.artistsData.get(otherEvent.artistId);
          
          if (otherArtist) {
            // Get compatibility if available
            let compatibility: number | undefined;
            
            const compatRecord = await this.getArtistCompatibility(artistId, otherArtist.id);
            compatibility = compatRecord?.compatibilityScore;
            
            opportunities.push({
              artist: otherArtist,
              event: otherEvent,
              compatibility,
              distance
            });
          }
        }
      }
    }
    
    // Sort by compatibility and distance
    return opportunities.sort((a, b) => {
      // If both have compatibility scores, sort by that first
      if (a.compatibility !== undefined && b.compatibility !== undefined) {
        if (a.compatibility !== b.compatibility) {
          return b.compatibility - a.compatibility; // Higher compatibility first
        }
      }
      
      // Otherwise, sort by distance
      return a.distance - b.distance; // Closer first
    });
  }

  async getArtistStatistics(artistId: string): Promise<{ 
    upcomingEvents: number;
    collaborationRequests: number;
    pendingRequests: number;
    totalCompatibleArtists: number;
  }> {
    // Get upcoming events count
    const now = new Date();
    const events = Array.from(this.eventsData.values())
      .filter(event => 
        event.artistId === artistId && 
        new Date(event.eventDate) >= now
      );
    
    // Get collaboration requests
    const receivedRequests = Array.from(this.collaborationRequestsData.values())
      .filter(req => req.receivingArtistId === artistId);
    
    const sentRequests = Array.from(this.collaborationRequestsData.values())
      .filter(req => req.requestingArtistId === artistId);
    
    // Get pending requests count
    const pendingRequests = receivedRequests.filter(req => req.status === 'pending');
    
    // Get compatible artists count
    const compatibleArtists = await this.getCompatibleArtists(artistId, 50);
    
    return {
      upcomingEvents: events.length,
      collaborationRequests: receivedRequests.length + sentRequests.length,
      pendingRequests: pendingRequests.length,
      totalCompatibleArtists: compatibleArtists.length
    };
  }

  // Venue operations
  async getVenue(id: number): Promise<Venue | undefined> {
    return this.venuesData.get(id);
  }

  async getVenues(options?: { limit?: number; city?: string }): Promise<Venue[]> {
    let venues = Array.from(this.venuesData.values());
    
    // Filter by city if provided
    if (options?.city) {
      venues = venues.filter(venue => venue.city === options.city);
    }
    
    // Apply limit if provided
    if (options?.limit && options.limit > 0) {
      venues = venues.slice(0, options.limit);
    }
    
    return venues;
  }

  async createVenue(venue: InsertVenue): Promise<Venue> {
    // Generate a numeric ID
    const id = venue.id || Math.floor(Math.random() * 10000) + 1;
    const newVenue: Venue = {
      ...venue,
      id,
      website: venue.website || null,
      description: venue.description || null,
      capacity: venue.capacity || null,
      contactName: venue.contactName || null,
      contactEmail: venue.contactEmail || null,
      contactPhone: venue.contactPhone || null,
      bookingEmail: venue.bookingEmail || null,
      amenities: venue.amenities || null,
      genre: venue.genre || null,
      socialMedia: venue.socialMedia || null,
      stageSize: venue.stageSize || null,
      soundSystem: venue.soundSystem || null,
      backline: venue.backline || null,
      greenRoom: venue.greenRoom || null,
      loadIn: venue.loadIn || null,
      bandsintown_id: venue.bandsintown_id || null
    };
    
    this.venuesData.set(id, newVenue);
    return newVenue;
  }

  async updateVenue(id: number, venue: Partial<InsertVenue>): Promise<Venue | undefined> {
    const existingVenue = this.venuesData.get(id);
    if (!existingVenue) return undefined;
    
    const updatedVenue = { ...existingVenue, ...venue };
    this.venuesData.set(id, updatedVenue);
    
    return updatedVenue;
  }

  async deleteVenue(id: number): Promise<boolean> {
    return this.venuesData.delete(id);
  }
  
  async getVenuesNear(options: { latitude: string; longitude: string; radiusMiles: number; limit?: number }): Promise<Venue[]> {
    const venues = Array.from(this.venuesData.values());
    
    // Convert coordinates to numbers
    const lat = parseFloat(options.latitude);
    const lng = parseFloat(options.longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
      throw new Error("Invalid coordinates");
    }
    
    // Calculate distance for each venue and filter
    const venuesWithDistance = venues
      .map(venue => {
        // Skip venues without coordinates
        if (!venue.latitude || !venue.longitude) return { venue, distance: Infinity };
        
        const venueLat = parseFloat(venue.latitude);
        const venueLng = parseFloat(venue.longitude);
        
        if (isNaN(venueLat) || isNaN(venueLng)) return { venue, distance: Infinity };
        
        const distance = calculateDistance(lat, lng, venueLat, venueLng);
        return { venue, distance };
      })
      .filter(item => item.distance <= options.radiusMiles)
      .sort((a, b) => a.distance - b.distance); // Sort by closest first
    
    // Apply limit if provided
    const limitedResults = options.limit ? venuesWithDistance.slice(0, options.limit) : venuesWithDistance;
    
    // Return just the venues without the distance
    return limitedResults.map(item => item.venue);
  }

  // Initialize with sample data for testing
  private initializeSampleData() {
    // Check if we already have imported artists
    if (this.artistsData.size > 0) {
      console.log(`Using existing ${this.artistsData.size} artists, ${this.eventsData.size} events, and ${this.venuesData.size} venues`);
      return; // Skip initialization if we already have data
    }
    
    // Sample artists
    const artists: Artist[] = [
      {
        id: "art1",
        name: "The Melodic Harmony",
        genres: ["indie rock", "alternative", "folk"],
        imageUrl: "https://example.com/artist1.jpg",
        url: "https://bandsintown.com/artist1",
        website: "https://melodicharmony.com",
        description: "An indie rock band known for their haunting melodies and introspective lyrics",
        location: "Portland, OR",
        country: "USA",
        drawSize: 500,
        lookingToCollaborate: true,
        collaborationTypes: ["joint shows", "recordings", "music videos"],
        socialMedia: { instagram: "@melodicharmony", twitter: "@themelodic" },
        createdAt: new Date("2023-01-15")
      },
      {
        id: "art2",
        name: "Electronic Dreams",
        genres: ["electronic", "synth-pop", "ambient"],
        imageUrl: "https://example.com/artist2.jpg",
        url: "https://bandsintown.com/artist2",
        website: "https://electronicdreams.io",
        description: "Creating atmospheric electronic soundscapes that transport listeners to other dimensions",
        location: "Seattle, WA",
        country: "USA",
        drawSize: 350,
        lookingToCollaborate: true,
        collaborationTypes: ["remixes", "joint shows"],
        socialMedia: { instagram: "@electronicdreams", soundcloud: "electronicdreams" },
        createdAt: new Date("2023-02-20")
      },
      {
        id: "art3",
        name: "Rhythm Collective",
        genres: ["hip-hop", "jazz", "funk"],
        imageUrl: "https://example.com/artist3.jpg",
        url: "https://bandsintown.com/artist3", 
        website: "https://rhythmcollective.net",
        description: "A collaborative group fusing hip-hop beats with jazz instrumentation and funk grooves",
        location: "Chicago, IL",
        country: "USA",
        drawSize: 800,
        lookingToCollaborate: true,
        collaborationTypes: ["featured verses", "live shows", "production"],
        socialMedia: { instagram: "@rhythmcollective", twitter: "@rhythmcollect" },
        createdAt: new Date("2023-03-10")
      }
    ];
    
    // Add artists to storage
    for (const artist of artists) {
      this.artistsData.set(artist.id, artist);
    }
    
    // Sample events
    const events: Event[] = [
      {
        id: "evt1",
        artistId: "art1",
        venueName: "The Echo Lounge",
        venueCity: "Portland",
        venueState: "OR",
        venueCountry: "USA",
        latitude: "45.5152",
        longitude: "-122.6784",
        eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        ticketUrl: "https://tickets.com/event1",
        collaborationOpen: true,
        createdAt: new Date(),
        posterUrl: "https://images.unsplash.com/photo-1508252592163-5d3c3c559404?q=80&w=200&auto=format&fit=crop" // Live concert image
      },
      {
        id: "evt2",
        artistId: "art2",
        venueName: "Digital Dreams Club",
        venueCity: "Seattle",
        venueState: "WA",
        venueCountry: "USA",
        latitude: "47.6062",
        longitude: "-122.3321",
        eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        ticketUrl: "https://tickets.com/event2",
        collaborationOpen: true,
        createdAt: new Date(),
        posterUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=200&auto=format&fit=crop" // Electronic music show image
      },
      {
        id: "evt3",
        artistId: "art3",
        venueName: "Jazz & Beats Lounge",
        venueCity: "Chicago",
        venueState: "IL",
        venueCountry: "USA",
        latitude: "41.8781",
        longitude: "-87.6298",
        eventDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        ticketUrl: "https://tickets.com/event3",
        collaborationOpen: false,
        createdAt: new Date(),
        posterUrl: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=200&auto=format&fit=crop" // Jazz club image
      }
    ];
    
    // Add events to storage
    for (const event of events) {
      this.eventsData.set(event.id, event);
    }
    
    // Generate some collaboration requests
    const requests: CollaborationRequest[] = [
      {
        id: 1,
        requestingArtistId: "art1",
        receivingArtistId: "art2",
        eventId: "evt2",
        message: "We love your music and would be interested in opening for you at the Digital Dreams Club show!",
        status: "pending",
        requestDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        responseDate: null
      },
      {
        id: 2,
        requestingArtistId: "art3",
        receivingArtistId: "art1",
        eventId: "evt1",
        message: "Would you be interested in having us add some live instrumentation to your set?",
        status: "accepted",
        requestDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        responseDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      }
    ];
    
    // Add requests to storage
    for (const request of requests) {
      this.collaborationRequestsData.set(request.id, request);
    }
    
    // Initialize collaboration request ID counter
    this.collaborationRequestIdCounter = requests.length + 1;
    
    // Calculate and store some compatibility scores
    this.calculateAndStoreCompatibility("art1", "art2");
    this.calculateAndStoreCompatibility("art1", "art3");
    this.calculateAndStoreCompatibility("art2", "art3");
    
    // Sample venues
    const venues: Venue[] = [
      {
        id: 1,
        name: "The Echo Lounge",
        address: "215 SE Morrison St",
        city: "Portland",
        state: "OR",
        latitude: "45.5152",
        longitude: "-122.6784",
        website: "https://example.com/echo-lounge",
        description: "A cozy music venue known for showcasing indie rock and folk artists, with excellent acoustics and an intimate atmosphere.",
        capacity: 350,
        bandsintown_id: null,
        zipCode: "97214",
        contactName: null,
        contactEmail: null,
        contactPhone: null,
        bookingEmail: null,
        amenities: null,
        genre: null,
        socialMedia: null,
        stageSize: null,
        soundSystem: null,
        backline: null,
        greenRoom: null,
        loadIn: null
      },
      {
        id: 2,
        name: "Digital Dreams Club",
        address: "500 Pine Street",
        city: "Seattle",
        state: "WA",
        latitude: "47.6062",
        longitude: "-122.3321",
        website: "https://example.com/digital-dreams",
        description: "An electronic music venue with state-of-the-art sound system and lighting. Popular with electronic, synth-pop, and ambient artists.",
        capacity: 500,
        bandsintown_id: null,
        zipCode: "98101",
        contactName: null,
        contactEmail: null,
        contactPhone: null,
        bookingEmail: null,
        amenities: null,
        genre: null,
        socialMedia: null,
        stageSize: null,
        soundSystem: null,
        backline: null,
        greenRoom: null,
        loadIn: null
      },
      {
        id: 3,
        name: "Jazz & Beats Lounge",
        address: "125 N Wells St",
        city: "Chicago",
        state: "IL",
        latitude: "41.8781",
        longitude: "-87.6298",
        website: "https://example.com/jazz-beats",
        description: "A historic venue featuring jazz, hip-hop, and funk artists. Known for its excellent acoustics and vibrant atmosphere.",
        capacity: 400,
        bandsintown_id: null,
        zipCode: "60606",
        contactName: null,
        contactEmail: null,
        contactPhone: null,
        bookingEmail: null,
        amenities: null,
        genre: null,
        socialMedia: null,
        stageSize: null,
        soundSystem: null,
        backline: null,
        greenRoom: null,
        loadIn: null
      }
    ];
    
    // Add venues to storage
    for (const venue of venues) {
      this.venuesData.set(venue.id, venue);
    }
  }
}

// Use DatabaseStorage for persistent data storage
export const storage = new DatabaseStorage();