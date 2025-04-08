import { storage } from "../storage";
import { User, insertArtistSchema, insertVenueSchema } from "../../shared/schema";

/**
 * Service to handle post-registration role assignment
 * Creates the appropriate entity (artist/venue) for a newly registered user
 * This version uses Replit DB for storage
 */
export class UserRoleService {
  /**
   * Creates an artist profile for a user
   * @param user The newly created user
   * @returns The created artist ID
   */
  async createArtistProfile(user: User): Promise<number> {
    try {
      // Create a basic artist profile with minimal required information
      const artistData = {
        userId: user.id,
        name: user.name,
        genres: [],
        location: "",
        country: ""
      };

      // Validate with schema before inserting
      insertArtistSchema.parse(artistData);

      // Insert artist and return the ID
      const createdArtist = await storage.createArtist(artistData);
      
      if (!createdArtist || !createdArtist.id) {
        throw new Error("Failed to create artist profile");
      }

      return createdArtist.id;
    } catch (error) {
      console.error("Error creating artist profile:", error);
      throw error;
    }
  }

  /**
   * Creates or links a venue profile for a user
   * @param user The newly created user
   * @param existingVenueId Optional existing venue ID to link instead of creating a new one
   * @returns The created or linked venue ID
   */
  async createVenueProfile(user: User, existingVenueId?: number): Promise<number> {
    try {
      let venueId: number;
      
      if (existingVenueId) {
        // If an existing venue ID is provided, verify it exists
        const venue = await storage.getVenueById(existingVenueId);
        
        if (!venue) {
          throw new Error(`Venue with ID ${existingVenueId} not found`);
        }
        
        // Use the existing venue ID
        venueId = existingVenueId;
        console.log(`Linking user to existing venue ID: ${venueId}`);
      } else {
        // Create a new venue profile with minimal required fields
        const venueData = {
          name: user.name,
          address: "To be updated",
          city: "To be updated",
          state: "To be updated",
          zipCode: "00000",
          latitude: "0",
          longitude: "0"
        };

        // Validate with schema before inserting
        insertVenueSchema.parse(venueData);
        
        // Insert venue and return the ID
        const createdVenue = await storage.createVenue(venueData);
        
        if (!createdVenue || !createdVenue.id) {
          throw new Error("Failed to create venue profile");
        }
        
        venueId = createdVenue.id;
        console.log(`Created new venue with ID: ${venueId}`);
      }

      // Link venue to user by updating user record
      const updatedUser = await storage.updateUser(user.id, { venueId });
      console.log('Updated user with venue ID:', updatedUser);

      return venueId;
    } catch (error) {
      console.error("Error creating or linking venue profile:", error);
      throw error;
    }
  }

  /**
   * Assigns the appropriate role to a user based on their user type
   * @param user The newly registered user
   * @param existingVenueId Optional ID of an existing venue to link the user to
   * @returns An object containing the user and any created profile IDs
   */
  async assignUserRole(user: User, existingVenueId?: number): Promise<{ 
    user: User, 
    artistId?: number,
    venueId?: number
  }> {
    try {
      let artistId: number | undefined;
      let venueId: number | undefined;

      // Create the appropriate profile based on user type
      switch (user.userType) {
        case 'artist':
          artistId = await this.createArtistProfile(user);
          break;
        case 'venue':
          venueId = await this.createVenueProfile(user, existingVenueId);
          // The user update is done in createVenueProfile
          break;
        // Fans don't get additional profiles currently
        case 'fan':
          break;
        default:
          throw new Error(`Unsupported user type: ${user.userType}`);
      }

      // Fetch the latest user data after any updates
      const latestUser = await storage.getUserById(user.id);
      
      if (!latestUser) {
        throw new Error(`User with ID ${user.id} not found after role assignment`);
      }

      return { 
        user: latestUser,
        artistId,
        venueId
      };
    } catch (error) {
      console.error("Error assigning user role:", error);
      throw error;
    }
  }
}

// Export a singleton instance
export const userRoleService = new UserRoleService();