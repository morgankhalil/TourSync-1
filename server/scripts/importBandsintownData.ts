import axios from 'axios';
import { storage } from '../storage';
import { ExternalArtist, ExternalEvent, InsertArtist, InsertEvent } from '../../shared/schema';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const APP_ID = process.env.BANDSINTOWN_APP_ID;

if (!APP_ID) {
  console.error('BANDSINTOWN_APP_ID environment variable is required');
  process.exit(1);
}

// List of artists to import
const ARTISTS_TO_IMPORT = [
  'Metallica',
  'Taylor Swift',
  'The Weeknd',
  'Bad Bunny',
  'Dua Lipa',
  'Billie Eilish',
  'Post Malone',
  'Imagine Dragons',
  'The Killers',
  'Coldplay'
];

// List of popular venues to create sample events
const POPULAR_VENUES = [
  {
    name: "Madison Square Garden",
    city: "New York",
    state: "NY",
    country: "USA",
    latitude: "40.7505",
    longitude: "-73.9934"
  },
  {
    name: "The O2 Arena",
    city: "London",
    state: null,
    country: "UK",
    latitude: "51.5030",
    longitude: "0.0032"
  },
  {
    name: "Staples Center",
    city: "Los Angeles",
    state: "CA",
    country: "USA",
    latitude: "34.0430",
    longitude: "-118.2673"
  },
  {
    name: "United Center",
    city: "Chicago",
    state: "IL",
    country: "USA",
    latitude: "41.8807",
    longitude: "-87.6742"
  },
  {
    name: "Sydney Opera House",
    city: "Sydney",
    state: "NSW",
    country: "Australia",
    latitude: "-33.8568",
    longitude: "151.2153"
  },
  {
    name: "AccorHotels Arena",
    city: "Paris",
    state: null,
    country: "France",
    latitude: "48.8387",
    longitude: "2.3787"
  },
  {
    name: "Nippon Budokan",
    city: "Tokyo",
    state: null,
    country: "Japan",
    latitude: "35.6934",
    longitude: "139.7517"
  },
  {
    name: "Scotiabank Arena",
    city: "Toronto",
    state: "ON",
    country: "Canada",
    latitude: "43.6435",
    longitude: "-79.3791"
  },
  {
    name: "Olympiastadion",
    city: "Berlin",
    state: null,
    country: "Germany",
    latitude: "52.5147",
    longitude: "13.2395"
  },
  {
    name: "The Forum",
    city: "Los Angeles",
    state: "CA",
    country: "USA",
    latitude: "33.9584",
    longitude: "-118.3416"
  },
  {
    name: "Red Rocks Amphitheatre",
    city: "Morrison",
    state: "CO",
    country: "USA",
    latitude: "39.6655",
    longitude: "-105.2059"
  },
  {
    name: "The Fillmore",
    city: "San Francisco",
    state: "CA",
    country: "USA",
    latitude: "37.7842",
    longitude: "-122.4320"
  },
  {
    name: "Royal Albert Hall",
    city: "London",
    state: null,
    country: "UK",
    latitude: "51.5010",
    longitude: "-0.1774"
  },
  {
    name: "Bridgestone Arena",
    city: "Nashville",
    state: "TN",
    country: "USA",
    latitude: "36.1592",
    longitude: "-86.7785"
  },
  {
    name: "Wembley Stadium",
    city: "London",
    state: null,
    country: "UK",
    latitude: "51.5560",
    longitude: "-0.2795"
  }
];

// Generate a random future date for event
function getRandomFutureDate(): Date {
  const now = new Date();
  // Random date between today and 6 months from now
  const futureDate = new Date(
    now.getFullYear(),
    now.getMonth() + Math.floor(Math.random() * 6),
    1 + Math.floor(Math.random() * 28), // Day between 1-28 to avoid month overflow
    18 + Math.floor(Math.random() * 4), // Hour between 6pm-10pm
    0 // Minutes
  );
  return futureDate;
}

// Fetch artist data from Bandsintown
async function fetchArtistData(artistName: string): Promise<ExternalArtist | null> {
  try {
    const response = await axios.get(`https://rest.bandsintown.com/artists/${encodeURIComponent(artistName)}?app_id=${APP_ID}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching data for artist ${artistName}:`, error);
    return null;
  }
}

// Fetch events for an artist from Bandsintown
async function fetchArtistEvents(artistName: string): Promise<ExternalEvent[]> {
  try {
    const response = await axios.get(`https://rest.bandsintown.com/artists/${encodeURIComponent(artistName)}/events?app_id=${APP_ID}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching events for artist ${artistName}:`, error);
    return [];
  }
}

// Create sample events for an artist
function createSampleEvents(artistId: string, artistImageUrl: string | null): InsertEvent[] {
  // Randomly select 2-5 venues for this artist
  const numVenues = 2 + Math.floor(Math.random() * 4); // 2-5 venues
  const shuffledVenues = [...POPULAR_VENUES].sort(() => 0.5 - Math.random());
  const selectedVenues = shuffledVenues.slice(0, numVenues);
  
  // Create events for each selected venue
  return selectedVenues.map(venue => {
    const eventDate = getRandomFutureDate();
    
    return {
      artistId,
      venueName: venue.name,
      venueCity: venue.city,
      venueState: venue.state,
      venueCountry: venue.country,
      latitude: venue.latitude,
      longitude: venue.longitude,
      eventDate,
      ticketUrl: `https://www.ticketmaster.com/events/${artistId}-${Date.now()}`,
      posterUrl: artistImageUrl, // Use artist image as poster
      collaborationOpen: Math.random() > 0.3, // 70% chance of being open for collaboration
    };
  });
}

// Import artist and events data
async function importArtistsAndEvents() {
  console.log('Starting Bandsintown data import...');
  
  // Clear existing data - only for demonstration purposes
  await clearExistingData();
  
  for (const artistName of ARTISTS_TO_IMPORT) {
    console.log(`Importing data for ${artistName}...`);
    
    // Fetch artist data
    const artistData = await fetchArtistData(artistName);
    if (!artistData) {
      console.log(`Failed to fetch data for ${artistName}, skipping...`);
      continue;
    }

    // Create artist in our database
    const artist: InsertArtist = {
      name: artistData.name,
      genres: artistData.genres || [],
      imageUrl: artistData.image_url || null,
      url: artistData.url || null,
      website: artistData.website || null,
      description: `Popular artist imported from Bandsintown.`,
      location: 'Unknown', // Not provided by Bandsintown API
      country: 'Unknown', // Not provided by Bandsintown API
      drawSize: artistData.draw_size || 0,
      lookingToCollaborate: true,
      collaborationTypes: ['Opening Act', 'Co-headline', 'Feature'],
      socialMedia: {},
    };

    // Save artist
    const savedArtist = await storage.createArtist(artist);
    console.log(`Created artist: ${savedArtist.name} (${savedArtist.id})`);

    // First try to fetch real events
    let events = await fetchArtistEvents(artistName);
    
    // If no real events, create some sample events
    if (events.length === 0) {
      console.log(`No real events found for ${artistName}, creating sample events...`);
      const sampleEvents = createSampleEvents(savedArtist.id, artist.imageUrl);
      
      // Save each sample event
      for (const eventData of sampleEvents) {
        const savedEvent = await storage.createEvent(eventData);
        console.log(`Created sample event: ${savedEvent.venueName} on ${new Date(savedEvent.eventDate).toLocaleDateString()}`);
      }
    } else {
      console.log(`Found ${events.length} real events for ${artistName}`);
      
      // Save each real event
      for (const eventData of events) {
        // Skip events without venue info
        if (!eventData.venue) {
          continue;
        }

        const event: InsertEvent = {
          artistId: savedArtist.id,
          venueName: eventData.venue.name,
          venueCity: eventData.venue.city,
          venueState: eventData.venue.region || null,
          venueCountry: eventData.venue.country,
          latitude: eventData.venue.latitude,
          longitude: eventData.venue.longitude,
          eventDate: new Date(eventData.datetime),
          ticketUrl: `https://www.bandsintown.com/t/${eventData.id}`, // Construct ticket URL
          posterUrl: artistData.image_url || null, // Use artist image as poster since Bandsintown doesn't provide event posters
          collaborationOpen: Math.random() > 0.5, // Randomly set collaboration status
        };

        const savedEvent = await storage.createEvent(event);
        console.log(`Created event: ${savedEvent.venueName} on ${new Date(savedEvent.eventDate).toLocaleDateString()}`);
      }
    }
  }

  console.log('Bandsintown data import completed!');
}

// For demonstration purposes - clear existing data before import
async function clearExistingData() {
  try {
    console.log('Clearing existing data...');
    
    // Get all events
    const events = await storage.getEventsInDateRange(
      new Date(2000, 0, 1), // From January 1, 2000
      new Date(2100, 0, 1)  // To January 1, 2100
    );
    
    // Delete all events
    for (const event of events) {
      await storage.deleteEvent(event.id);
    }
    
    // Get all artists
    const artists = await storage.getArtists();
    
    // Delete all artists
    for (const artist of artists) {
      if (artist.id.startsWith('art')) continue; // Skip sample artists with IDs like 'art1', 'art2'
      await storage.deleteArtist(artist.id);
    }
    
    console.log(`Cleared ${events.length} events and ${artists.length} artists.`);
  } catch (error) {
    console.error('Error clearing existing data:', error);
  }
}

// Run the import
importArtistsAndEvents()
  .then(() => {
    console.log('Import completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Import failed:', error);
    process.exit(1);
  });