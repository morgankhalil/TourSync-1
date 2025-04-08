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
   * Creates a venue profile for a user
   * @param user The newly created user
   * @returns The created venue ID
   */
  async createVenueProfile(user: User): Promise<number> {
    try {
      // Create a basic venue profile with minimal required fields
      // Note: Venues require more fields, we'll use placeholder values initially
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

      // Link venue to user
      await db
        .update(users)
        .set({ venueId: createdVenue.id })
        .where(users.id === user.id);

      return createdVenue.id;
    } catch (error) {
      console.error("Error creating venue profile:", error);
      throw error;
    }
  }

  /**
   * Assigns the appropriate role to a user based on their user type
   * @param user The newly registered user
   * @returns An object containing the user and any created profile IDs
   */
  async assignUserRole(user: User): Promise<{ 
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
          venueId = await this.createVenueProfile(user);
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