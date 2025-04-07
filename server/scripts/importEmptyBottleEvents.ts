import { db } from '../db';
import { addDays } from 'date-fns';
import { venues, tours, tourDates, venueAvailability } from '@shared/schema';

async function importEmptyBottleEvents() {
  try {
    console.log('Starting Empty Bottle data import...');

    // 1. Create the Empty Bottle venue if it doesn't exist
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

    // 2. Generate availability for next 6 months
    const startDate = new Date();
    const endDate = addDays(startDate, 180);
    let currentDate = startDate;

    while (currentDate <= endDate) {
      await db.insert(venueAvailability).values({
        venueId: venue.id,
        date: currentDate.toISOString(),
        isAvailable: Math.random() > 0.3 // 70% chance of being available
      });
      currentDate = addDays(currentDate, 1);
    }

    // 3. Create sample tours
    const sampleTours = [
      {
        name: "Spring Awakening Tour",
        startDate: new Date('2025-04-01').toISOString(),
        endDate: new Date('2025-05-15').toISOString(),
        bandId: 1,
        notes: "Midwest leg of national tour",
        isActive: true
      },
      {
        name: "Underground Sound Tour",
        startDate: new Date('2025-04-15').toISOString(),
        endDate: new Date('2025-05-30').toISOString(),
        bandId: 2,
        notes: "Independent venues showcase",
        isActive: true
      }
    ];

    for (const tourData of sampleTours) {
      const [tour] = await db.insert(tours).values(tourData).returning();

      await db.insert(tourDates).values({
        tourId: tour.id,
        venueId: venue.id,
        date: new Date(new Date(tourData.startDate).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        city: "Chicago",
        state: "IL",
        status: "confirmed",
        notes: `Performing at ${venue.name}`,
        venueName: venue.name,
        isOpenDate: false
      });
    }

    console.log('Successfully imported Empty Bottle data');
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