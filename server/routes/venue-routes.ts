import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { insertVenueSchema } from '../../shared/schema';
import { zodValidationMiddleware } from '../middleware/zod-validation';

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
    const { id } = req.params;
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
router.post('/', zodValidationMiddleware(insertVenueSchema), async (req, res) => {
  try {
    const venueData = req.body;
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
    const { id } = req.params;
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
    const { id } = req.params;
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

export default router;