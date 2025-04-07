
import { db } from '../db';
import { addDays } from 'date-fns';
import { venues, tours, tourDates, venueAvailability, bands } from '@shared/schema';
import { BandsintownApiService } from '../services/bandsintown-api';

async function importEmptyBottleEvents() {
  try {
    console.log('Starting Empty Bottle data import...');

    // Initialize Bandsintown API service
    const bandsintownApi = new BandsintownApiService(process.env.BANDSINTOWN_API_KEY || '');

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
        // Create a tour for the band
        const tourStartDate = new Date(event.datetime);
        const tourEndDate = addDays(tourStartDate, 30); // Assume 30-day tour

        const [tour] = await db.insert(tours).values({
          name: `${event.lineup[0]} ${tourStartDate.getFullYear()} Tour`,
          startDate: tourStartDate.toISOString(),
          endDate: tourEndDate.toISOString(),
          bandId: band.id,
          notes: event.description || "Midwest Tour",
          isActive: true
        }).returning();

        // Create tour date for this show
        await db.insert(tourDates).values({
          tourId: tour.id,
          venueId: venue.id,
          date: event.datetime,
          city: "Chicago",
          state: "IL",
          status: "confirmed",
          notes: event.description || `Performing at ${venue.name}`,
          venueName: venue.name,
          isOpenDate: false
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
