import { IStorage } from '../storage';
import { db } from '../db';
import { bands, venues, tours, tourDates, venueAvailability,
         type Band, type InsertBand, 
         type Venue, type InsertVenue,
         type Tour, type InsertTour,
         type TourDate, type InsertTourDate,
         type VenueAvailability, type InsertVenueAvailability } from '@shared/schema';
import { eq, and, between, or, like, sql } from 'drizzle-orm';

export class DatabaseStorage implements IStorage {
  // Band operations
  async getBand(id: number): Promise<Band | undefined> {
    const [band] = await db.select().from(bands).where(eq(bands.id, id));
    return band || undefined;
  }

  async getBands(): Promise<Band[]> {
    return await db.select().from(bands);
  }

  async createBand(band: InsertBand): Promise<Band> {
    const [newBand] = await db.insert(bands).values(band).returning();
    return newBand;
  }

  async updateBand(id: number, band: Partial<InsertBand>): Promise<Band | undefined> {
    const [updatedBand] = await db.update(bands)
      .set(band)
      .where(eq(bands.id, id))
      .returning();
    return updatedBand || undefined;
  }

  async deleteBand(id: number): Promise<boolean> {
    const result = await db.delete(bands).where(eq(bands.id, id));
    return result !== undefined;
  }

  // Venue operations
  async getVenue(id: number): Promise<Venue | undefined> {
    const [venue] = await db.select().from(venues).where(eq(venues.id, id));
    return venue || undefined;
  }

  async getVenues(): Promise<Venue[]> {
    return await db.select().from(venues);
  }

  async getVenuesByLocation(lat: number, lng: number, radius: number): Promise<Venue[]> {
    // Using Postgres for distance calculation with the haversine formula
    const haversine = sql`
      6371 * acos(
        cos(radians(${lat})) *
        cos(radians(cast(${venues.latitude} as float))) *
        cos(radians(cast(${venues.longitude} as float)) - radians(${lng})) +
        sin(radians(${lat})) *
        sin(radians(cast(${venues.latitude} as float)))
      )
    `;
    
    return await db.select()
      .from(venues)
      .where(sql`${haversine} <= ${radius}`);
  }

  async createVenue(venue: InsertVenue): Promise<Venue> {
    const [newVenue] = await db.insert(venues).values(venue).returning();
    return newVenue;
  }

  async updateVenue(id: number, venue: Partial<InsertVenue>): Promise<Venue | undefined> {
    const [updatedVenue] = await db.update(venues)
      .set(venue)
      .where(eq(venues.id, id))
      .returning();
    return updatedVenue || undefined;
  }

  async deleteVenue(id: number): Promise<boolean> {
    const result = await db.delete(venues).where(eq(venues.id, id));
    return result !== undefined;
  }

  // Tour operations
  async getTour(id: number): Promise<Tour | undefined> {
    const [tour] = await db.select().from(tours).where(eq(tours.id, id));
    return tour || undefined;
  }

  async getTours(bandId?: number): Promise<Tour[]> {
    if (bandId) {
      return await db.select().from(tours).where(eq(tours.bandId, bandId));
    }
    return await db.select().from(tours);
  }

  async createTour(tour: InsertTour): Promise<Tour> {
    const [newTour] = await db.insert(tours)
      .values({ ...tour, isActive: true })
      .returning();
    return newTour;
  }

  async updateTour(id: number, tour: Partial<InsertTour>): Promise<Tour | undefined> {
    const [updatedTour] = await db.update(tours)
      .set(tour)
      .where(eq(tours.id, id))
      .returning();
    return updatedTour || undefined;
  }

  async deleteTour(id: number): Promise<boolean> {
    const result = await db.delete(tours).where(eq(tours.id, id));
    return result !== undefined;
  }

  // Tour date operations
  async getTourDate(id: number): Promise<TourDate | undefined> {
    const [tourDate] = await db.select().from(tourDates).where(eq(tourDates.id, id));
    return tourDate || undefined;
  }

  async getTourDates(tourId: number): Promise<TourDate[]> {
    return await db.select().from(tourDates).where(eq(tourDates.tourId, tourId));
  }

  async createTourDate(tourDate: InsertTourDate): Promise<TourDate> {
    // Calculate isOpenDate based on whether venueId is provided
    const isOpenDate = !tourDate.venueId;
    
    // Add venue name if venueId is specified
    let venueName: string | undefined = undefined;
    if (tourDate.venueId) {
      const [venue] = await db.select().from(venues).where(eq(venues.id, tourDate.venueId));
      if (venue) {
        venueName = venue.name;
      }
    }
    
    const [newTourDate] = await db.insert(tourDates)
      .values({ ...tourDate, isOpenDate, venueName })
      .returning();
    return newTourDate;
  }

  async updateTourDate(id: number, tourDate: Partial<InsertTourDate>): Promise<TourDate | undefined> {
    // First get the existing tour date
    const [existingTourDate] = await db.select().from(tourDates).where(eq(tourDates.id, id));
    if (!existingTourDate) return undefined;
    
    let updateValues: any = { ...tourDate };
    
    // Update isOpenDate if venueId changed
    if (tourDate.venueId !== undefined) {
      updateValues.isOpenDate = !tourDate.venueId;
      
      // Update venue name if applicable
      if (tourDate.venueId) {
        const [venue] = await db.select().from(venues).where(eq(venues.id, tourDate.venueId));
        if (venue) {
          updateValues.venueName = venue.name;
        }
      } else {
        updateValues.venueName = null;
      }
    }
    
    const [updatedTourDate] = await db.update(tourDates)
      .set(updateValues)
      .where(eq(tourDates.id, id))
      .returning();
    return updatedTourDate || undefined;
  }

  async deleteTourDate(id: number): Promise<boolean> {
    const result = await db.delete(tourDates).where(eq(tourDates.id, id));
    return result !== undefined;
  }

  // Venue availability operations
  async getVenueAvailability(venueId: number): Promise<VenueAvailability[]> {
    return await db.select()
      .from(venueAvailability)
      .where(eq(venueAvailability.venueId, venueId));
  }

  async createVenueAvailability(availability: InsertVenueAvailability): Promise<VenueAvailability> {
    const [newAvailability] = await db.insert(venueAvailability)
      .values(availability)
      .returning();
    return newAvailability;
  }

  async updateVenueAvailability(id: number, availability: Partial<InsertVenueAvailability>): Promise<VenueAvailability | undefined> {
    const [updatedAvailability] = await db.update(venueAvailability)
      .set(availability)
      .where(eq(venueAvailability.id, id))
      .returning();
    return updatedAvailability || undefined;
  }

  async deleteVenueAvailability(id: number): Promise<boolean> {
    const result = await db.delete(venueAvailability).where(eq(venueAvailability.id, id));
    return result !== undefined;
  }

  // Specialized operations
  async findAvailableVenuesBetweenDates(
    startDate: Date, 
    endDate: Date, 
    startLat: number, 
    startLng: number, 
    endLat: number, 
    endLng: number, 
    radius: number
  ): Promise<Venue[]> {
    // Calculate midpoint between start and end coordinates
    const midLat = (startLat + endLat) / 2;
    const midLng = (startLng + endLng) / 2;
    
    // Find venues within the radius of the midpoint
    // that are available during the given date range
    const haversine = sql`
      6371 * acos(
        cos(radians(${midLat})) *
        cos(radians(cast(${venues.latitude} as float))) *
        cos(radians(cast(${venues.longitude} as float)) - radians(${midLng})) +
        sin(radians(${midLat})) *
        sin(radians(cast(${venues.latitude} as float)))
      )
    `;
    
    // First get venues within radius
    const nearbyVenues = await db.select()
      .from(venues)
      .where(sql`${haversine} <= ${radius}`);
    
    if (nearbyVenues.length === 0) return [];
    
    // Then filter by availability
    const venueIds = nearbyVenues.map(v => v.id);
    
    // Get venues that don't have conflicting availability records
    const unavailableVenueIds = await db.select({ id: venueAvailability.venueId })
      .from(venueAvailability)
      .where(
        and(
          eq(venueAvailability.isAvailable, false),
          between(
            venueAvailability.date,
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
          ),
          or(...venueIds.map(id => eq(venueAvailability.venueId, id)))
        )
      );
    
    const unavailableIds = new Set(unavailableVenueIds.map(v => v.id));
    return nearbyVenues.filter(v => !unavailableIds.has(v.id));
  }

  async findVenuesAlongRoute(waypoints: {lat: number, lng: number}[], radius: number): Promise<Venue[]> {
    const venueSet = new Set<Venue>();
    
    for (const waypoint of waypoints) {
      const nearbyVenues = await this.getVenuesByLocation(waypoint.lat, waypoint.lng, radius);
      for (const venue of nearbyVenues) {
        venueSet.add(venue);
      }
    }
    
    return Array.from(venueSet);
  }

  async getTourStats(tourId: number): Promise<{totalShows: number, confirmed: number, pending: number, openDates: number}> {
    const tourDatesData = await this.getTourDates(tourId);
    
    const totalShows = tourDatesData.length;
    const confirmed = tourDatesData.filter(td => td.status === 'confirmed').length;
    const pending = tourDatesData.filter(td => td.status === 'pending').length;
    const openDates = tourDatesData.filter(td => td.status === 'open' || td.isOpenDate).length;
    
    return {
      totalShows,
      confirmed,
      pending,
      openDates
    };
  }
}