import { Router } from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { zodQueryValidationMiddleware } from '../middleware/zod-validation';

const router = Router();

// Schema for getVenuesNear query parameters
const getVenuesNearSchema = z.object({
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  radius: z.coerce.number().optional().default(25), // Default radius of 25 miles
  limit: z.coerce.number().optional().default(20)
});

// Get venues near a location
router.get('/near', zodQueryValidationMiddleware(getVenuesNearSchema), async (req, res) => {
  try {
    // The Zod middleware has already validated and converted the types
    const params = req.query as unknown as z.infer<typeof getVenuesNearSchema>;
    
    const venues = await storage.getVenuesNear({
      latitude: params.latitude.toString(),
      longitude: params.longitude.toString(),
      radiusMiles: params.radius,
      limit: params.limit
    });
    
    res.json(venues);
  } catch (error) {
    console.error('Error getting venues near location:', error);
    res.status(500).json({ error: 'Failed to retrieve venues near location' });
  }
});

// Get venues with upcoming events
router.get('/with-events', async (req, res) => {
  try {
    // Get all venues
    const venues = await storage.getVenues();
    
    // Get events in the next 30 days
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setDate(now.getDate() + 30);
    
    const events = await storage.getEventsInDateRange(now, futureDate);
    
    // Get unique venue IDs from the events
    const eventVenueIds = new Set();
    for (const event of events) {
      // Use venueName as a unique identifier since we don't have venueId in the event model
      const venueKey = `${event.venueName}|${event.venueCity}|${event.venueState || ''}`;
      eventVenueIds.add(venueKey);
    }
    
    // Filter venues that have upcoming events
    const venuesWithEvents = venues.filter(venue => {
      const venueKey = `${venue.name}|${venue.city}|${venue.state || ''}`;
      return eventVenueIds.has(venueKey);
    });
    
    res.json(venuesWithEvents);
  } catch (error) {
    console.error('Error getting venues with events:', error);
    res.status(500).json({ error: 'Failed to retrieve venues with events' });
  }
});

export default router;