import { db } from '../db';
import { addDays } from 'date-fns';
import { venues, tours, tourDates, venueAvailability, bands } from '@shared/schema';
import { BandsintownApiService } from '../services/bandsintown-api';

async function importEmptyBottleEvents() {
  try {
    console.log('Starting Empty Bottle data import...');

    // Validate required environment variables
    if (!process.env.BANDSINTOWN_API_KEY) {
      throw new Error('BANDSINTOWN_API_KEY environment variable is not set');
    }

    // Initialize services with retry logic
    let retries = 0;
    const MAX_RETRIES = 3;
    let bandsintownApi;

    while (retries < MAX_RETRIES) {
      try {
        bandsintownApi = new BandsintownApiService(process.env.BANDSINTOWN_API_KEY);
        await bandsintownApi.validateApiKey();
        break;
      } catch (error) {
        retries++;
        if (retries === MAX_RETRIES) {
          throw new Error(`Failed to initialize Bandsintown API after ${MAX_RETRIES} attempts`);
        }
        console.log(`Retry ${retries}/${MAX_RETRIES} initializing Bandsintown API...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }

    // Validate API key
    const apiKey = process.env.BANDSINTOWN_API_KEY;
    if (!apiKey) {
      throw new Error('BANDSINTOWN_API_KEY environment variable is not set');
    }

    // Initialize Bandsintown API service
    const bandsintownApi = new BandsintownApiService(apiKey);

    // 1. Create or get the Empty Bottle venue
    const existingVenue = await db.query.venues.findFirst({
      where: (venues, { eq, and }) => 
        and(eq(venues.name, 'Empty Bottle'), eq(venues.city, 'Chicago'))
    });

    let venue;
    if (!existingVenue) {
      const [createdVenue] = await db.insert(venues).values({
        name: "Empty Bottle",
        address: "1035 N Western Ave",
        city: "Chicago",
        state: "IL",
        zipCode: "60622",
        capacity: 400,
        contactName: "Booking Manager",
        contactEmail: "booking@emptybottle.com",
        contactPhone: "773-276-3600",
        description: "Iconic Chicago venue for indie and underground music",
        genre: "Indie, Rock, Alternative",
        dealType: "Door Split",
        latitude: "41.8998",
        longitude: "-87.6868",
        technicalSpecs: {
          stage: "15x20 feet",
          sound: "Full PA system",
          lighting: "Basic stage lighting"
        },
        venueType: "Club",
        amenities: {
          greenRoom: true,
          parking: "Street parking",
          bar: true
        },
        pastPerformers: []
      }).returning();
      venue = createdVenue;
    } else {
      venue = existingVenue;
    }

    // 2. Fetch upcoming shows from Bandsintown
    const events = await bandsintownApi.getVenueEvents("Empty Bottle", "Chicago, IL");
    console.log(`Found ${events.length} upcoming events`);

    // 3. Create bands and tours from the events
    for (const event of events) {
      // Create band if doesn't exist
      const [band] = await db.insert(bands).values({
        name: event.lineup[0], // Use headliner
        genre: "Rock", // Default genre
        contactEmail: `booking@${event.lineup[0].toLowerCase().replace(/\s+/g, '')}.com`,
        formedYear: new Date().getFullYear() - Math.floor(Math.random() * 10),
        hometown: "Chicago, IL",
        description: `${event.lineup[0]} is performing at Empty Bottle`
      })
      .onConflictDoNothing()
      .returning();

      if (band) {
        // Create a tour for the band with proper date handling
        const eventDate = new Date(event.datetime);
        
        // Ensure dates are normalized to midnight UTC
        const tourStartDate = new Date(Date.UTC(
          eventDate.getUTCFullYear(),
          eventDate.getUTCMonth(),
          eventDate.getUTCDate(),
          0, 0, 0, 0
        ));
        
        // Calculate tour end date (30 days after start)
        const tourEndDate = new Date(Date.UTC(
          tourStartDate.getUTCFullYear(),
          tourStartDate.getUTCMonth(),
          tourStartDate.getUTCDate() + 30,
          0, 0, 0, 0
        ));

        // Validate dates
        if (isNaN(tourStartDate.getTime()) || isNaN(tourEndDate.getTime())) {
          console.error(`Invalid date for tour: ${event.lineup[0]} - ${event.datetime}`);
          continue;
        }

        // Additional validation for future dates only
        if (tourStartDate < new Date()) {
          console.warn(`Skipping past event for: ${event.lineup[0]}`);
          continue;
        }

        const [tour] = await db.insert(tours).values({
          name: `${event.lineup[0]} ${normalizedStartDate.getFullYear()} Tour`,
          startDate: normalizedStartDate.toISOString().split('T')[0], // Store as YYYY-MM-DD
          endDate: normalizedEndDate.toISOString().split('T')[0],
          bandId: band.id,
          notes: event.description || "Midwest Tour",
          isActive: true
        }).returning();

        // Create tour date for this show
        await db.insert(tourDates).values({
          tourId: tour.id,
          venueId: venue.id,
          date: new Date(event.datetime).toISOString().split('T')[0],
          city: "Chicago",
          state: "IL",
          status: "confirmed",
          notes: event.description || `Performing at ${venue.name}`,
          venueName: venue.name,
          isOpenDate: false,
          validatedAt: new Date().toISOString()
        });

        console.log(`Created tour date for ${band.name} on ${new Date(event.datetime).toLocaleDateString()}`);
      }
    }

    // 4. Generate venue availability excluding event dates
    const startDate = new Date();
    const endDate = addDays(startDate, 180);
    let currentDate = startDate;

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString();
      const hasEvent = events.some(event => 
        new Date(event.datetime).toDateString() === currentDate.toDateString()
      );

      await db.insert(venueAvailability).values({
        venueId: venue.id,
        date: dateStr,
        isAvailable: !hasEvent // Available if no event
      });

      currentDate = addDays(currentDate, 1);
    }

    console.log('Successfully imported Empty Bottle data with real events');
  } catch (error) {
    console.error('Error importing Empty Bottle data:', error);
    throw error;
  }
}

importEmptyBottleEvents()
  .then(() => {
    console.log('Import complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });