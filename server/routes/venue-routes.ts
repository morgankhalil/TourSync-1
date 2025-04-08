import { Router, Express } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { db } from '../db';
import { sql } from 'drizzle-orm';
import { insertVenueSchema, venues, venueClusters, venueClusterMembers } from '../../shared/schema';
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
router.post('/', zodValidationMiddleware(insertVenueSchema), async (req, res) => {
  try {
    const venueData = req.body;
    const venue = await storage.createVenue(venueData);

    // Regenerate capacity clusters after adding new venue
    try {
      await db
        .delete(venueClusters)
        .where(sql`${venueClusters.name} LIKE '%Venues' AND ${venueClusters.description} LIKE '%capacity%'`);

      const venues = await db.select().from(venues).where(sql`${venues.capacity} IS NOT NULL`);
      
      const capacityCategories = [
        { name: "Small Venues", min: 0, max: 300, description: "Intimate venues with capacity up to 300" },
        { name: "Medium Venues", min: 301, max: 800, description: "Mid-sized venues with capacity from 301 to 800" },
        { name: "Large Venues", min: 801, max: Number.MAX_SAFE_INTEGER, description: "Large venues with capacity over 800" }
      ];

      for (const category of capacityCategories) {
        const clusterResult = await db.insert(venueClusters).values({
          name: category.name,
          description: category.description,
          regionCode: "CAPACITY",
          isStatic: true
        }).returning();

        const clusterId = clusterResult[0].id;
        const capacityVenues = venues.filter(v => 
          v.capacity !== null && 
          v.capacity >= category.min && 
          v.capacity <= category.max
        );

        for (const venue of capacityVenues) {
          await db.insert(venueClusterMembers).values({
            clusterId,
            venueId: venue.id
          });
        }
      }
    } catch (clusterError) {
      console.error('Error regenerating capacity clusters:', clusterError);
      // Don't fail venue creation if cluster generation fails
    }

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

export function registerVenueRoutes(app: Express): void {
  app.use('/api/venues', router);
}

export default router;