import { IStorage } from '../storage';
import { db } from '../db';
import { bands, venues, tours, tourDates, venueAvailability, artists, artistDiscovery,
         type Band, type InsertBand, 
         type Venue, type InsertVenue,
         type Tour, type InsertTour,
         type TourDate, type InsertTourDate,
         type VenueAvailability, type InsertVenueAvailability,
         type Artist, type InsertArtist, type ArtistDiscoveryRecord } from '@shared/schema';
import { eq, and, between, or, like, sql, asc } from 'drizzle-orm';

export class DatabaseStorage implements IStorage {
  // Artist operations
  async getArtist(id: string): Promise<Artist | undefined> {
    return db.query.artists.findFirst({
      where: eq(artists.id, id)
    });
  }

  async getArtists(options: { limit?: number; genres?: string[] } = {}): Promise<Artist[]> {
    const { limit, genres } = options;
    let query = db.select().from(artists);
    
    if (genres?.length) {
      // Filter by genres if provided
      query = query.where(sql`${artists.genres} ?& ${genres}`);
    }
    
    if (limit) {
      query = query.limit(limit);
    }
    
    return query;
  }

  async createArtist(artist: InsertArtist): Promise<Artist> {
    const [result] = await db.insert(artists).values(artist).returning();
    return result;
  }

  async updateArtist(id: string, artist: Partial<InsertArtist>): Promise<Artist | undefined> {
    const [result] = await db.update(artists)
      .set(artist)
      .where(eq(artists.id, id))
      .returning();
    return result;
  }

  async deleteArtist(id: string): Promise<boolean> {
    const result = await db.delete(artists)
      .where(eq(artists.id, id));
    return result.rowCount > 0;
  }

  // Artist discovery tracking
  async getArtistDiscovery(artistId: string): Promise<ArtistDiscovery | undefined> {
    return db.query.artistDiscovery.findFirst({
      where: eq(artistDiscovery.artistId, artistId)
    });
  }

  async recordArtistDiscovery(discovery: InsertArtistDiscovery): Promise<ArtistDiscovery> {
    const [result] = await db.insert(artistDiscovery).values(discovery).returning();
    return result;
  }

  async updateArtistDiscovery(artistId: string, discovery: Partial<InsertArtistDiscovery>): Promise<ArtistDiscovery | undefined> {
    const [result] = await db.update(artistDiscovery)
      .set(discovery)
      .where(eq(artistDiscovery.artistId, artistId))
      .returning();
    return result;
  }
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
    try {
      const [venue] = await db.select().from(venues).where(eq(venues.id, id));
      return venue || undefined;
    } catch (error) {
      console.error(`Error fetching venue ${id}:`, error);
      return undefined;
    }
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

  // Tour optimization methods

  async findVenuesNearExistingVenue(venueId: number, radius: number, excludeVenueIds: number[] = []): Promise<Venue[]> {
    // First get the venue to find its coordinates
    const venue = await this.getVenue(venueId);
    if (!venue) {
      return [];
    }

    // Get venues near this venue's coordinates
    const nearbyVenues = await this.getVenuesByLocation(
      parseFloat(venue.latitude), 
      parseFloat(venue.longitude), 
      radius
    );

    // Filter out the excluded venues and the original venue
    return nearbyVenues.filter(v => 
      v.id !== venueId && 
      !excludeVenueIds.includes(v.id)
    );
  }

  async findTourGaps(tourId: number, minGapDays: number = 2): Promise<{startDate: Date, endDate: Date, durationDays: number}[]> {
    // Get all tour dates sorted by date
    const tourDates = await db.query.tourDates.findMany({
      where: eq(schema.tourDates.tourId, tourId),
      orderBy: asc(schema.tourDates.date)
    });

    if (tourDates.length <= 1) {
      return []; // No gaps with 0 or 1 date
    }

    // Get the tour details to establish overall date range
    const tour = await this.getTour(tourId);
    if (!tour) {
      return [];
    }

    const gaps: {startDate: Date, endDate: Date, durationDays: number}[] = [];

    // Check for a gap at the beginning of the tour
    const firstTourDate = new Date(tourDates[0].date);
    const tourStartDate = new Date(tour.startDate);

    const initialGapDays = Math.floor((firstTourDate.getTime() - tourStartDate.getTime()) / (1000 * 60 * 60 * 24));
    if (initialGapDays >= minGapDays) {
      gaps.push({
        startDate: tourStartDate,
        endDate: new Date(firstTourDate.getTime() - 86400000), // day before first tour date
        durationDays: initialGapDays
      });
    }

    // Check for gaps between dates
    for (let i = 0; i < tourDates.length - 1; i++) {
      const currentDate = new Date(tourDates[i].date);
      const nextDate = new Date(tourDates[i + 1].date);

      const diffDays = Math.floor((nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays > minGapDays) {
        gaps.push({
          startDate: new Date(currentDate.getTime() + 86400000), // day after current date
          endDate: new Date(nextDate.getTime() - 86400000), // day before next date
          durationDays: diffDays - 1
        });
      }
    }

    // Check for a gap at the end of the tour
    const lastTourDate = new Date(tourDates[tourDates.length - 1].date);
    const tourEndDate = new Date(tour.endDate);

    const finalGapDays = Math.floor((tourEndDate.getTime() - lastTourDate.getTime()) / (1000 * 60 * 60 * 24));
    if (finalGapDays >= minGapDays) {
      gaps.push({
        startDate: new Date(lastTourDate.getTime() + 86400000), // day after last tour date
        endDate: tourEndDate,
        durationDays: finalGapDays
      });
    }

    return gaps;
  }

  async findVenuesForTourGap(tourId: number, gapStartDate: Date, gapEndDate: Date, radius: number): Promise<Venue[]> {
    // Get the tour to determine its general route
    const tour = await this.getTour(tourId);
    if (!tour) {
      return [];
    }

    // Get all tour dates ordered by date
    const tourDates = await db.query.tourDates.findMany({
      where: eq(schema.tourDates.tourId, tourId),
      orderBy: asc(schema.tourDates.date)
    });

    if (tourDates.length < 2) {
      return []; // Need at least 2 dates to determine a route
    }

    // Find dates before and after gap
    let beforeVenue: Venue | undefined;
    let afterVenue: Venue | undefined;

    for (let i = 0; i < tourDates.length; i++) {
      const tourDate = tourDates[i];
      const dateObj = new Date(tourDate.date);

      if (dateObj < gapStartDate && (!beforeVenue || dateObj > new Date(beforeVenue.date))) {
        // Find venue for this date
        if (tourDate.venueId) {
          const venue = await this.getVenue(tourDate.venueId);
          if (venue) {
            beforeVenue = { ...venue, date: tourDate.date };
          }
        }
      }

      if (dateObj > gapEndDate && (!afterVenue || dateObj < new Date(afterVenue.date))) {
        // Find venue for this date
        if (tourDate.venueId) {
          const venue = await this.getVenue(tourDate.venueId);
          if (venue) {
            afterVenue = { ...venue, date: tourDate.date };
          }
        }
      }
    }

    // If we don't have before/after venues, use wider search
    if (!beforeVenue || !afterVenue) {
      return [];
    }

    // Find venues between these two points
    const beforeLat = parseFloat(beforeVenue.latitude);
    const beforeLng = parseFloat(beforeVenue.longitude);
    const afterLat = parseFloat(afterVenue.latitude);
    const afterLng = parseFloat(afterVenue.longitude);

    // Create a central point between the two venues
    const midLat = (beforeLat + afterLat) / 2;
    const midLng = (beforeLng + afterLng) / 2;

    // Find venues near midpoint
    const venues = await this.getVenuesByLocation(midLat, midLng, radius);

    // Filter venues to make sure they're available during the gap
    const gapStartStr = gapStartDate.toISOString().split('T')[0];
    const gapEndStr = gapEndDate.toISOString().split('T')[0];

    const availableVenueIds = await db.select({ id: venueAvailability.venueId })
      .from(venueAvailability)
      .where(and(
        between(
          venueAvailability.date,
          gapStartStr,
          gapEndStr
        ),
        eq(venueAvailability.isAvailable, true)
      ));

    const availableIds = new Set(availableVenueIds.map(v => v.id));
    return venues.filter(v => availableIds.has(v.id));
  }


  // Artist operations
  async getArtists({ limit, genres }: { limit?: number; genres?: string[] } = {}): Promise<Artist[]> {
    try {
      let query = db.select().from(artists);

      if (genres && genres.length > 0) {
        query = query.where(sql`genres && ${genres}`);
      }

      if (limit) {
        query = query.limit(limit);
      }

      return await query;
    } catch (error) {
      console.error('Error getting artists:', error);
      return [];
    }
  }

  async recordArtistDiscovery(record: ArtistDiscoveryRecord): Promise<void> {
    try {
      await db.insert(artistDiscovery).values(record)
        .onConflictDoUpdate({
          target: artistDiscovery.artistId,
          set: {
            lastChecked: record.lastChecked,
            timesChecked: sql`${artistDiscovery.timesChecked} + 1`
          }
        });
    } catch (error) {
      console.error('Error recording artist discovery:', error);
    }
  }
}