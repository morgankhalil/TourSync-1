import axios from 'axios';
import { Band, InsertBand, Tour, InsertTour, TourDate, InsertTourDate, Venue, InsertVenue } from '@shared/schema';
import { storage } from '../storage';
import { format, addDays, parseISO } from 'date-fns';

// Types for Bandsintown API responses
interface BandsintownArtist {
  id: string;
  name: string;
  image_url: string;
  thumb_url: string;
  facebook_page_url: string;
  mbid: string;
  tracker_count: number;
  upcoming_event_count: number;
  url: string;
}

interface BandsintownEvent {
  id: string;
  artist_id: string;
  url: string;
  on_sale_datetime: string;
  datetime: string;
  description: string;
  venue: {
    name: string;
    latitude: string;
    longitude: string;
    city: string;
    region: string;
    country: string;
  };
  offers: Array<{
    type: string;
    url: string;
    status: string;
  }>;
  lineup: string[];
}

export class BandsintownIntegration {
  private apiKey: string;
  private baseUrl = 'https://rest.bandsintown.com';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Get artist information from Bandsintown
   */
  async getArtist(artistName: string): Promise<BandsintownArtist | null> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/artists/${encodeURIComponent(artistName)}`,
        { params: { app_id: this.apiKey } }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching artist data for ${artistName}:`, error);
      return null;
    }
  }

  /**
   * Get upcoming events for an artist
   */
  async getArtistEvents(artistName: string): Promise<BandsintownEvent[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/artists/${encodeURIComponent(artistName)}/events`,
        { params: { app_id: this.apiKey } }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching events for ${artistName}:`, error);
      return [];
    }
  }

  /**
   * Import a band from Bandsintown
   */
  async importBand(artistName: string): Promise<Band | null> {
    const artistData = await this.getArtist(artistName);
    if (!artistData) {
      return null;
    }

    // Create or update band record
    const bandData: InsertBand = {
      name: artistData.name,
      contactEmail: `contact@${artistData.name.toLowerCase().replace(/\s+/g, '')}.com`, // Placeholder email
      contactPhone: null,
      description: `${artistData.name} is a band with ${artistData.tracker_count.toLocaleString()} followers on Bandsintown.`,
      genre: null, // Bandsintown doesn't provide genre info
      social: {
        facebook: artistData.facebook_page_url,
        website: artistData.url,
        bandsintown: `https://www.bandsintown.com/${encodeURIComponent(artistData.name)}`
      }
    };

    try {
      // Check if band already exists
      const existingBands = await storage.getBands();
      const existingBand = existingBands.find(b => 
        b.name.toLowerCase() === artistData.name.toLowerCase()
      );

      if (existingBand) {
        // Update existing band
        return await storage.updateBand(existingBand.id, bandData);
      } else {
        // Create new band
        return await storage.createBand(bandData);
      }
    } catch (error) {
      console.error(`Error saving band data for ${artistName}:`, error);
      return null;
    }
  }

  /**
   * Import tour data for a band from Bandsintown
   */
  async importTourData(bandId: number, artistName: string): Promise<Tour | null> {
    const events = await this.getArtistEvents(artistName);
    if (!events || events.length === 0) {
      console.log(`No upcoming events found for ${artistName}`);
      return null;
    }

    // Group events into a tour
    const sortedEvents = [...events].sort(
      (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
    );

    const startDate = sortedEvents[0].datetime;
    const endDate = sortedEvents[sortedEvents.length - 1].datetime;

    // Create tour
    const tourData: InsertTour = {
      name: `${artistName} ${format(new Date(startDate), 'yyyy')} Tour`,
      startDate: format(new Date(startDate), 'yyyy-MM-dd'),
      endDate: format(new Date(endDate), 'yyyy-MM-dd'),
      bandId,
      notes: `Imported from Bandsintown on ${format(new Date(), 'yyyy-MM-dd')}`,
      isActive: true
    };

    try {
      // Create the tour
      const tour = await storage.createTour(tourData);
      
      // Process events and create tour dates and venues
      for (const event of sortedEvents) {
        // Check if venue exists, create if not
        let venue: Venue | null = null;
        
        // Look for existing venue with similar coordinates
        const existingVenues = await storage.getVenuesByLocation(
          parseFloat(event.venue.latitude),
          parseFloat(event.venue.longitude),
          0.5 // Small radius to find exact venue
        );
        
        if (existingVenues.length > 0) {
          venue = existingVenues[0];
        } else {
          // Create new venue
          const venueData: InsertVenue = {
            name: event.venue.name,
            address: "Unknown Address", // Bandsintown doesn't provide full address
            city: event.venue.city,
            state: event.venue.region,
            zipCode: "00000", // Placeholder
            latitude: event.venue.latitude,
            longitude: event.venue.longitude,
            capacity: null,
            contactName: null,
            contactEmail: null,
            contactPhone: null,
            description: `${event.venue.name} in ${event.venue.city}, ${event.venue.region}, ${event.venue.country}`,
            amenities: null,
            techSpecs: null,
            dealType: null
          };
          
          venue = await storage.createVenue(venueData);
        }
        
        // Create tour date
        if (venue) {
          const tourDateData: InsertTourDate = {
            tourId: tour.id,
            date: format(new Date(event.datetime), 'yyyy-MM-dd'),
            city: event.venue.city,
            state: event.venue.region,
            venueId: venue.id,
            status: 'confirmed',
            notes: event.description || null,
            venueName: venue.name,
            isOpenDate: false
          };
          
          await storage.createTourDate(tourDateData);
        }
      }
      
      return tour;
    } catch (error) {
      console.error(`Error saving tour data for ${artistName}:`, error);
      return null;
    }
  }

  /**
   * Import artist and their tour data in one operation
   */
  async importArtistWithTourData(artistName: string): Promise<{ band: Band | null, tour: Tour | null }> {
    const band = await this.importBand(artistName);
    if (!band) {
      return { band: null, tour: null };
    }
    
    const tour = await this.importTourData(band.id, artistName);
    return { band, tour };
  }
  
  /**
   * Import multiple artists and their tour data
   */
  async batchImportArtists(artistNames: string[]): Promise<Array<{ artistName: string, success: boolean, band?: Band, tour?: Tour }>> {
    const results = [];
    
    for (const artistName of artistNames) {
      try {
        const { band, tour } = await this.importArtistWithTourData(artistName);
        results.push({
          artistName,
          success: !!band,
          band: band || undefined,
          tour: tour || undefined
        });
      } catch (error) {
        console.error(`Error importing ${artistName}:`, error);
        results.push({
          artistName,
          success: false
        });
      }
    }
    
    return results;
  }
}

// Helper function to create an integration instance
export function createBandsintownIntegration(apiKey: string): BandsintownIntegration {
  return new BandsintownIntegration(apiKey);
}