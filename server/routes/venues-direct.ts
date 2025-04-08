import { Router, Express } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { insertVenueSchema } from '../../shared/schema';

const router = Router();

// Get all venues with optional filtering
router.get('/', async (req, res) => {
  try {
    const { city, limit } = req.query;
    
    const options: { city?: string; limit?: number } = {};
    
    if (city && typeof city === 'string') {
      options.city = city;
    }
    
    if (limit && typeof limit === 'string') {
      const parsedLimit = parseInt(limit, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        options.limit = parsedLimit;
      }
    }
    
    const venues = await storage.getVenues(options);
    res.json(venues);
  } catch (error) {
    console.error('Error getting venues:', error);
    res.status(500).json({ error: 'Failed to retrieve venues' });
  }
});

// Get venue by ID
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid venue ID format' });
    }
    const venue = await storage.getVenue(id);
    
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }
    
    res.json(venue);
  } catch (error) {
    console.error('Error getting venue:', error);
    res.status(500).json({ error: 'Failed to retrieve venue' });
  }
});

// Create new venue
router.post('/', async (req, res) => {
  try {
    const venueData = req.body;
    
    // Validate the venue data
    const result = insertVenueSchema.safeParse(venueData);
    if (!result.success) {
      return res.status(400).json({ 
        error: 'Invalid venue data',
        details: result.error.format()
      });
    }
    
    const venue = await storage.createVenue(venueData);
    res.status(201).json(venue);
  } catch (error) {
    console.error('Error creating venue:', error);
    res.status(500).json({ error: 'Failed to create venue' });
  }
});

// Update venue
router.patch('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid venue ID format' });
    }
    const venueData = req.body;
    
    // Validate update data
    const updateSchema = insertVenueSchema.partial();
    const result = updateSchema.safeParse(venueData);
    
    if (!result.success) {
      return res.status(400).json({ 
        error: 'Invalid venue data', 
        details: result.error.format() 
      });
    }
    
    const updatedVenue = await storage.updateVenue(id, venueData);
    
    if (!updatedVenue) {
      return res.status(404).json({ error: 'Venue not found' });
    }
    
    res.json(updatedVenue);
  } catch (error) {
    console.error('Error updating venue:', error);
    res.status(500).json({ error: 'Failed to update venue' });
  }
});

// Delete venue
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid venue ID format' });
    }
    const success = await storage.deleteVenue(id);
    
    if (!success) {
      return res.status(404).json({ error: 'Venue not found' });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting venue:', error);
    res.status(500).json({ error: 'Failed to delete venue' });
  }
});

// Check venue availability
router.get('/:id/availability', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid venue ID format' });
    }
    
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate || typeof startDate !== 'string' || typeof endDate !== 'string') {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }
    
    const venue = await storage.getVenue(id);
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    
    // Get events in the date range
    const events = await storage.getEventsInDateRange(start, end);
    
    // Filter events for this venue
    const venueEvents = events.filter(event => {
      return (
        event.venueName === venue.name && 
        event.venueCity === venue.city && 
        (!event.venueState || event.venueState === venue.state)
      );
    });
    
    // Create an array of dates between start and end
    const dates: { date: string; available: boolean; eventId?: string }[] = [];
    const currentDate = new Date(start);
    
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const eventOnDate = venueEvents.find(event => {
        const eventDate = new Date(event.eventDate);
        return eventDate.toISOString().split('T')[0] === dateStr;
      });
      
      dates.push({
        date: dateStr,
        available: !eventOnDate,
        eventId: eventOnDate?.id
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    res.json({ dates });
  } catch (error) {
    console.error('Error checking venue availability:', error);
    res.status(500).json({ error: 'Failed to check venue availability' });
  }
});

export function registerVenuesDirectRoutes(app: Express): void {
  app.use('/api/venues-direct', router);
}

export default router;