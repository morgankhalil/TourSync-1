
import { BandsintownApiService } from '../services/bandsintown-api';
import dotenv from 'dotenv';
import { format } from 'date-fns';

dotenv.config();

async function fetchVenueEvents() {
  // Use the VITE prefixed env var since that's what's loaded in the environment
  const apiKey = process.env.VITE_BANDSINTOWN_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_BANDSINTOWN_API_KEY environment variable is not configured');
  }

  console.log('Initializing Bandsintown API service...');
  const api = new BandsintownApiService(apiKey);
  
  // Set date range for April
  const startDate = new Date('2024-04-01');
  const endDate = new Date('2024-04-30');

  try {
    console.log('Fetching events for Empty Bottle in Chicago...');
    const events = await api.getVenueEvents('Empty Bottle', 'Chicago, IL');
    
    if (!events || events.length === 0) {
      console.log('No events found for the venue');
      return;
    }

    // Filter events for April and limit to 5
    const aprilEvents = events
      .filter(event => {
        const eventDate = new Date(event.datetime);
        return eventDate >= startDate && eventDate <= endDate;
      })
      .slice(0, 5);

    console.log(`Found ${aprilEvents.length} events for April:`);
    aprilEvents.forEach(event => {
      console.log(`${format(new Date(event.datetime), 'MMM d')}: ${event.title}`);
      console.log(`Artist: ${event.artists[0].name}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Error fetching venue events:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    process.exit(1);
  }
}

fetchVenueEvents().catch(console.error);
