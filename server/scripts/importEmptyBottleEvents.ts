
import { db } from '../db';
import { tourDates, venues } from '../../shared/schema';
import { BandsintownApiService } from '../services/bandsintown-api';
import { format } from 'date-fns';

async function importEmptyBottleEvents() {
  try {
    // Get the Empty Bottle venue
    const venue = await db.query.venues.findFirst({
      where: (venues, { eq }) => eq(venues.id, 39)  // Empty Bottle ID is 39
    });

    if (!venue) {
      throw new Error('Empty Bottle venue not found');
    }

    // Initialize Bandsintown API service
    const apiKey = process.env.BANDSINTOWN_API_KEY;
    if (!apiKey) {
      throw new Error('Bandsintown API key not configured');
    }
    
    const api = new BandsintownApiService(apiKey);

    // Define date range
    const startDate = '2025-04-01';
    const endDate = '2025-05-31';

    console.log(`Fetching events for ${venue.name} from ${startDate} to ${endDate}`);

    // Fetch events for the venue
    const events = await api.getArtistEvents('Empty Bottle', startDate, endDate);

    console.log(`Found ${events.length} events`);

    // Convert events to tour dates
    for (const event of events) {
      await db.insert(tourDates).values({
        venueId: venue.id,
        date: new Date(event.datetime),
        status: 'confirmed',
        venueName: venue.name,
        isOpenDate: false,
        notes: `Lineup: ${event.lineup.join(', ')}`
      });
    }

    console.log('Successfully imported events');
    
  } catch (error) {
    console.error('Error importing events:', error);
    throw error;
  }
}

importEmptyBottleEvents()
  .catch(console.error)
  .finally(() => {
    console.log('Import complete');
    process.exit(0);
  });
