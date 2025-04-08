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
    const { latitude, longitude, radius, limit } = req.query as z.infer<typeof getVenuesNearSchema>;
    
    const venues = await storage.getVenuesNear({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      radiusMiles: radius,
      limit
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
    // Use storage method if available, otherwise return empty array for now
    const venues = await storage.getVenuesWithEvents ? 
      storage.getVenuesWithEvents() : 
      [];
    
    res.json(venues);
  } catch (error) {
    console.error('Error getting venues with events:', error);
    res.status(500).json({ error: 'Failed to retrieve venues with events' });
  }
});

export default router;