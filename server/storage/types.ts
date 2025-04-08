import { User, Artist, Venue, Event, CollaborationRequest } from '../../shared/schema';

/**
 * Interface for storage operations
 * This ensures the same methods are available regardless of which storage implementation is used
 */
export interface IStorage {
  // Initialize storage
  initialize(): Promise<void>;

  // User operations
  createUser(userData: Omit<User, 'id'>): Promise<User>;
  getUserById(id: number): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  updateUser(id: number, updates: Partial<Omit<User, 'id'>>): Promise<User | null>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  
  // Artist operations
  createArtist(artistData: Omit<Artist, 'id'>): Promise<Artist>;
  getArtistById(id: number): Promise<Artist | null>;
  getArtistByUserId(userId: number): Promise<Artist | null>;
  updateArtist(id: number, updates: Partial<Omit<Artist, 'id'>>): Promise<Artist | null>;
  deleteArtist(id: number): Promise<boolean>;
  getAllArtists(): Promise<Artist[]>;
  
  // Venue operations
  createVenue(venueData: Omit<Venue, 'id'>): Promise<Venue>;
  getVenueById(id: number): Promise<Venue | null>;
  updateVenue(id: number, updates: Partial<Omit<Venue, 'id'>>): Promise<Venue | null>;
  deleteVenue(id: number): Promise<boolean>;
  getAllVenues(): Promise<Venue[]>;
  
  // Event operations - note events have string IDs
  createEvent(eventData: Event): Promise<Event>;
  getEventById(id: string): Promise<Event | null>;
  updateEvent(id: string, updates: Partial<Omit<Event, 'id'>>): Promise<Event | null>;
  deleteEvent(id: string): Promise<boolean>;
  getAllEvents(): Promise<Event[]>;
  getEventsByArtistId(artistId: number): Promise<Event[]>;
  
  // Collaboration Request operations
  createCollaborationRequest(requestData: Omit<CollaborationRequest, 'id'>): Promise<CollaborationRequest>;
  getCollaborationRequestById(id: number): Promise<CollaborationRequest | null>;
  updateCollaborationRequest(id: number, updates: Partial<Omit<CollaborationRequest, 'id'>>): Promise<CollaborationRequest | null>;
  deleteCollaborationRequest(id: number): Promise<boolean>;
  getAllCollaborationRequests(): Promise<CollaborationRequest[]>;
  getCollaborationRequestsByArtistId(artistId: number): Promise<CollaborationRequest[]>;
}