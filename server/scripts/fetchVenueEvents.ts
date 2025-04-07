
import { createBandsintownIntegration } from '../integrations/bandsintown';
import dotenv from 'dotenv';
import { addMonths, format } from 'date-fns';

dotenv.config();

async function fetchVenueEvents() {
  if (!process.env.VITE_BANDSINTOWN_API_KEY) {
    throw new Error('Bandsintown API key not configured');
  }

  const integration = createBandsintownIntegration(process.env.VITE_BANDSINTOWN_API_KEY);
  
  // Set date range for April
  const startDate = new Date('2024-04-01');
  const endDate = new Date('2024-04-30');

  try {
    const events = await integration.getArtistEvents('Empty Bottle');
    
    // Filter events for April and limit to 5
    const aprilEvents = events
      .filter(event => {
        const eventDate = new Date(event.datetime);
        return eventDate >= startDate && eventDate <= endDate;
      })
      .slice(0, 5);

    console.log('Found events:', aprilEvents.length);
    aprilEvents.forEach(event => {
      console.log(`${format(new Date(event.datetime), 'MMM d')}: ${event.title}`);
      console.log(`Artist: ${event.artists[0].name}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Error fetching venue events:', error);
  }
}

fetchVenueEvents().catch(console.error);
