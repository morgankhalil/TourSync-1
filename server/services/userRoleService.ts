import { db } from "../db";
import { User, artists, venues, users, insertArtistSchema, insertVenueSchema } from "../../shared/schema";
import { z } from "zod";
import { eq } from "drizzle-orm";

/**
 * Service to handle post-registration role assignment
 * Creates the appropriate entity (artist/venue) for a newly registered user
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
      const [createdArtist] = await db.insert(artists).values(artistData).returning({ id: artists.id });
      
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
        const venueResults = await db.select({ id: venues.id }).from(venues).where(eq(venues.id, existingVenueId)).limit(1);
        
        if (venueResults.length === 0) {
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
        const [createdVenue] = await db.insert(venues).values(venueData).returning({ id: venues.id });
        
        if (!createdVenue || !createdVenue.id) {
          throw new Error("Failed to create venue profile");
        }
        
        venueId = createdVenue.id;
        console.log(`Created new venue with ID: ${venueId}`);
      }

      // Link venue to user - use venueId instead of venue_id
      await db
        .update(users)
        .set({ venueId })
        .where(eq(users.id, user.id));

      // Fetch the updated user to confirm changes
      const updatedUserResults = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
      console.log('Updated user with venue ID:', updatedUserResults[0]);

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

      return { 
        user,
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