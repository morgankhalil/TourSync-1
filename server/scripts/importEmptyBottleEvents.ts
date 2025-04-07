
import { db } from '../db';
import { tourDates, venues, tours, venueAvailability } from '../../shared/schema';
import { BandsintownApiService } from '../services/bandsintown-api';
import { addDays, format } from 'date-fns';

async function importEmptyBottleData() {
  try {
    console.log('Starting Empty Bottle data import...');

    // 1. Get or create the Empty Bottle venue
    const venue = {
      id: 39,
      name: "The Empty Bottle",
      address: "1035 N Western Ave",
      city: "Chicago",
      state: "IL",
      zipCode: "60622",
      capacity: 400,
      contactName: "Bruce Finkelman",
      contactEmail: "booking@emptybottle.com",
      contactPhone: "(773) 276-3600",
      website: "https://www.emptybottle.com",
      description: "The Empty Bottle is a Chicago institution that's been presenting live music and entertainment 7 nights a week since 1992.",
      genre: "Indie Rock, Punk, Electronic",
      dealType: "percentage",
      latitude: "41.9007",
      longitude: "-87.6869",
      technicalSpecs: {
        soundSystem: "Full PA system",
        stageDimensions: "20x15",
        monitorSystem: "6 monitor mixes"
      },
      venueType: "Club",
      amenities: ["Green Room", "Full Bar", "Street Parking"],
      loadingInfo: "Load in through front door, street parking available"
    };

    // 2. Set up venue availability for April and May 2025
    const startDate = new Date('2025-04-01');
    const endDate = new Date('2025-05-31');
    let currentDate = startDate;

    while (currentDate <= endDate) {
      await db.insert(venueAvailability).values({
        venueId: venue.id,
        date: currentDate,
        isAvailable: Math.random() > 0.3 // 70% chance of being available
      });
      currentDate = addDays(currentDate, 1);
    }

    // 3. Create sample tours coming through the venue
    const sampleTours = [
      {
        name: "Spring Awakening Tour",
        startDate: new Date('2025-04-01'),
        endDate: new Date('2025-05-15'),
        bandId: 1,
        notes: "Midwest leg of national tour",
        isActive: true
      },
      {
        name: "Underground Sound Tour",
        startDate: new Date('2025-04-15'),
        endDate: new Date('2025-05-30'),
        bandId: 2,
        notes: "Independent venues showcase",
        isActive: true
      }
    ];

    for (const tourData of sampleTours) {
      const tour = await db.insert(tours).values(tourData).returning();
      
      // Add some tour dates at Empty Bottle
      await db.insert(tourDates).values({
        tourId: tour[0].id,
        venueId: venue.id,
        date: addDays(tour[0].startDate, 7),
        city: "Chicago",
        state: "IL",
        status: "confirmed",
        notes: `Performing at ${venue.name}`,
        venueName: venue.name,
        isOpenDate: false
      });
    }

    // 4. Import real events from Bandsintown API
    const apiKey = process.env.BANDSINTOWN_API_KEY;
    if (!apiKey) {
      throw new Error('Bandsintown API key not configured');
    }
    
    const api = new BandsintownApiService(apiKey);
    const events = await api.getArtistEvents('Empty Bottle', '2025-04-01', '2025-05-31');

    console.log(`Found ${events.length} events from Bandsintown`);

    // Convert Bandsintown events to tour dates
    for (const event of events) {
      // Create a tour for each event's headliner
      const tourData = {
        name: `${event.lineup[0]} Spring 2025 Tour`,
        startDate: new Date(event.datetime),
        endDate: addDays(new Date(event.datetime), 30),
        bandId: 1, // You may want to create/lookup proper band IDs
        notes: `Tour featuring ${event.lineup.join(', ')}`,
        isActive: true
      };

      const tour = await db.insert(tours).values(tourData).returning();

      // Add the tour date
      await db.insert(tourDates).values({
        tourId: tour[0].id,
        venueId: venue.id,
        date: new Date(event.datetime),
        city: "Chicago",
        state: "IL",
        status: "confirmed",
        notes: `Lineup: ${event.lineup.join(', ')}`,
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

importEmptyBottleData()
  .catch(console.error)
  .finally(() => {
    console.log('Import complete');
    process.exit(0);
  });
