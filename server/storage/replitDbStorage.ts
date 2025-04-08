import { replitDb } from '../lib/replitDb';
import { 
  User, 
  Artist, 
  Venue, 
  Event, 
  CollaborationRequest, 
  ArtistCompatibility,
  Tour,
  TourDate,
  Band,
  VenueRelationship,
  VenueCluster
} from '../../shared/schema';
import { IStorage } from './types';

/**
 * Storage adapter for Replit Database
 * This bridges between the Replit key-value database and our application models
 */
export class ReplitDbStorage implements IStorage {
  // Collection prefixes for different entity types
  private static readonly USERS_COLLECTION = 'users';
  private static readonly ARTISTS_COLLECTION = 'artists';
  private static readonly VENUES_COLLECTION = 'venues';
  private static readonly EVENTS_COLLECTION = 'events';
  private static readonly COLLABORATION_REQUESTS_COLLECTION = 'collaboration_requests';
  private static readonly ARTIST_COMPATIBILITY_COLLECTION = 'artist_compatibility';
  private static readonly TOURS_COLLECTION = 'tours';
  private static readonly TOUR_DATES_COLLECTION = 'tour_dates';
  private static readonly BANDS_COLLECTION = 'bands';
  private static readonly VENUE_RELATIONSHIPS_COLLECTION = 'venue_relationships';
  private static readonly VENUE_CLUSTERS_COLLECTION = 'venue_clusters';

  /**
   * Initialize collections if they don't exist
   */
  async initialize(): Promise<void> {
    try {
      // Ensure collection metadata exists for each entity type
      const collections = [
        ReplitDbStorage.USERS_COLLECTION,
        ReplitDbStorage.ARTISTS_COLLECTION,
        ReplitDbStorage.VENUES_COLLECTION,
        ReplitDbStorage.EVENTS_COLLECTION,
        ReplitDbStorage.COLLABORATION_REQUESTS_COLLECTION,
        ReplitDbStorage.ARTIST_COMPATIBILITY_COLLECTION,
        ReplitDbStorage.TOURS_COLLECTION,
        ReplitDbStorage.TOUR_DATES_COLLECTION,
        ReplitDbStorage.BANDS_COLLECTION,
        ReplitDbStorage.VENUE_RELATIONSHIPS_COLLECTION,
        ReplitDbStorage.VENUE_CLUSTERS_COLLECTION
      ];

      for (const collection of collections) {
        const metaKey = `${collection}:meta`;
        const meta = await replitDb.get<{ nextId: number }>(metaKey);
        if (!meta) {
          await replitDb.set(metaKey, { nextId: 1 });
          console.log(`Initialized collection: ${collection}`);
        }
      }
    } catch (error) {
      console.error('Error initializing ReplitDbStorage:', error);
      throw error;
    }
  }

  // User methods
  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    return await replitDb.addToCollection<User>(ReplitDbStorage.USERS_COLLECTION, userData);
  }

  async getUserById(id: number): Promise<User | null> {
    return await replitDb.getFromCollection<User>(ReplitDbStorage.USERS_COLLECTION, id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const allUsers = await replitDb.getAllFromCollection<User>(ReplitDbStorage.USERS_COLLECTION);
    return allUsers.find(user => user.email === email) || null;
  }

  async updateUser(id: number, updates: Partial<Omit<User, 'id'>>): Promise<User | null> {
    return await replitDb.updateInCollection<User>(ReplitDbStorage.USERS_COLLECTION, id, updates);
  }

  async deleteUser(id: number): Promise<boolean> {
    return await replitDb.deleteFromCollection(ReplitDbStorage.USERS_COLLECTION, id);
  }

  async getAllUsers(): Promise<User[]> {
    return await replitDb.getAllFromCollection<User>(ReplitDbStorage.USERS_COLLECTION);
  }

  // Artist methods
  async createArtist(artistData: Omit<Artist, 'id'>): Promise<Artist> {
    return await replitDb.addToCollection<Artist>(ReplitDbStorage.ARTISTS_COLLECTION, artistData);
  }

  async getArtistById(id: number): Promise<Artist | null> {
    return await replitDb.getFromCollection<Artist>(ReplitDbStorage.ARTISTS_COLLECTION, id);
  }

  async getArtistByUserId(userId: number): Promise<Artist | null> {
    const allArtists = await replitDb.getAllFromCollection<Artist>(ReplitDbStorage.ARTISTS_COLLECTION);
    return allArtists.find(artist => artist.userId === userId) || null;
  }

  async updateArtist(id: number, updates: Partial<Omit<Artist, 'id'>>): Promise<Artist | null> {
    return await replitDb.updateInCollection<Artist>(ReplitDbStorage.ARTISTS_COLLECTION, id, updates);
  }

  async deleteArtist(id: number): Promise<boolean> {
    return await replitDb.deleteFromCollection(ReplitDbStorage.ARTISTS_COLLECTION, id);
  }

  async getAllArtists(): Promise<Artist[]> {
    return await replitDb.getAllFromCollection<Artist>(ReplitDbStorage.ARTISTS_COLLECTION);
  }

  // Venue methods
  async createVenue(venueData: Omit<Venue, 'id'>): Promise<Venue> {
    return await replitDb.addToCollection<Venue>(ReplitDbStorage.VENUES_COLLECTION, venueData);
  }

  async getVenueById(id: number): Promise<Venue | null> {
    return await replitDb.getFromCollection<Venue>(ReplitDbStorage.VENUES_COLLECTION, id);
  }

  async updateVenue(id: number, updates: Partial<Omit<Venue, 'id'>>): Promise<Venue | null> {
    return await replitDb.updateInCollection<Venue>(ReplitDbStorage.VENUES_COLLECTION, id, updates);
  }

  async deleteVenue(id: number): Promise<boolean> {
    return await replitDb.deleteFromCollection(ReplitDbStorage.VENUES_COLLECTION, id);
  }

  async getAllVenues(): Promise<Venue[]> {
    return await replitDb.getAllFromCollection<Venue>(ReplitDbStorage.VENUES_COLLECTION);
  }

  // Event methods
  async createEvent(eventData: Event): Promise<Event> {
    // Events have a text ID, which is provided, so we'll need to handle this a bit differently
    // Using the event ID as the key
    const itemKey = `${ReplitDbStorage.EVENTS_COLLECTION}:${eventData.id}`;
    await replitDb.set(itemKey, eventData);
    return eventData;
  }

  async getEventById(id: string): Promise<Event | null> {
    const itemKey = `${ReplitDbStorage.EVENTS_COLLECTION}:${id}`;
    return await replitDb.get<Event>(itemKey);
  }

  async updateEvent(id: string, updates: Partial<Omit<Event, 'id'>>): Promise<Event | null> {
    const itemKey = `${ReplitDbStorage.EVENTS_COLLECTION}:${id}`;
    const existingEvent = await replitDb.get<Event>(itemKey);
    
    if (!existingEvent) {
      return null;
    }
    
    const updatedEvent = { ...existingEvent, ...updates };
    await replitDb.set(itemKey, updatedEvent);
    
    return updatedEvent;
  }

  async deleteEvent(id: string): Promise<boolean> {
    const itemKey = `${ReplitDbStorage.EVENTS_COLLECTION}:${id}`;
    return await replitDb.delete(itemKey);
  }

  async getAllEvents(): Promise<Event[]> {
    // Get all keys with prefix
    const prefix = `${ReplitDbStorage.EVENTS_COLLECTION}:`;
    const keys = await replitDb.listWithPrefix(prefix);
    
    // Get all items
    const events = await Promise.all(
      keys.map(key => replitDb.get<Event>(key))
    );
    
    // Filter out any null items
    return events.filter((event): event is Event => event !== null);
  }

  async getEventsByArtistId(artistId: number): Promise<Event[]> {
    const allEvents = await this.getAllEvents();
    return allEvents.filter(event => event.artistId === artistId);
  }

  // Collaboration Request methods
  async createCollaborationRequest(requestData: Omit<CollaborationRequest, 'id'>): Promise<CollaborationRequest> {
    return await replitDb.addToCollection<CollaborationRequest>(
      ReplitDbStorage.COLLABORATION_REQUESTS_COLLECTION, 
      requestData
    );
  }

  async getCollaborationRequestById(id: number): Promise<CollaborationRequest | null> {
    return await replitDb.getFromCollection<CollaborationRequest>(
      ReplitDbStorage.COLLABORATION_REQUESTS_COLLECTION, 
      id
    );
  }

  async updateCollaborationRequest(
    id: number, 
    updates: Partial<Omit<CollaborationRequest, 'id'>>
  ): Promise<CollaborationRequest | null> {
    return await replitDb.updateInCollection<CollaborationRequest>(
      ReplitDbStorage.COLLABORATION_REQUESTS_COLLECTION, 
      id, 
      updates
    );
  }

  async deleteCollaborationRequest(id: number): Promise<boolean> {
    return await replitDb.deleteFromCollection(ReplitDbStorage.COLLABORATION_REQUESTS_COLLECTION, id);
  }

  async getAllCollaborationRequests(): Promise<CollaborationRequest[]> {
    return await replitDb.getAllFromCollection<CollaborationRequest>(
      ReplitDbStorage.COLLABORATION_REQUESTS_COLLECTION
    );
  }

  async getCollaborationRequestsByArtistId(artistId: number): Promise<CollaborationRequest[]> {
    const allRequests = await this.getAllCollaborationRequests();
    return allRequests.filter(
      request => 
        request.requestingArtistId === artistId || 
        request.receivingArtistId === artistId
    );
  }

  // Additional methods for other entities can be implemented as needed
  // ...

  // Helper methods for finding specific records by custom criteria
  private async findByField<T extends { id: number }>(
    collection: string, 
    field: keyof T, 
    value: any
  ): Promise<T | null> {
    const allItems = await replitDb.getAllFromCollection<T>(collection);
    return allItems.find(item => (item as any)[field] === value) || null;
  }

  private async findAllByField<T extends { id: number }>(
    collection: string, 
    field: keyof T, 
    value: any
  ): Promise<T[]> {
    const allItems = await replitDb.getAllFromCollection<T>(collection);
    return allItems.filter(item => (item as any)[field] === value);
  }
}

// Export a singleton instance
export const replitDbStorage = new ReplitDbStorage();