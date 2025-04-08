import express, { Request, Response } from 'express';
import { storage } from '../storage';
import { replitDbStorage } from '../storage/replitDbStorage';
import { isAuthenticated } from './auth-replit';

const router = express.Router();

// Get all venues
router.get('/', async (_req: Request, res: Response) => {
  try {
    // Use the replitDbStorage directly
    const venues = await replitDbStorage.getAllVenues();
    res.json(venues);
  } catch (error) {
    console.error('Error fetching venues:', error);
    res.status(500).json({ error: 'Failed to fetch venues' });
  }
});

// Get venue by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid venue ID' });
    }
    
    const venue = await replitDbStorage.getVenueById(id);
    
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }
    
    res.json(venue);
  } catch (error) {
    console.error('Error fetching venue:', error);
    res.status(500).json({ error: 'Failed to fetch venue' });
  }
});

// Create new venue - for testing, we're not requiring authentication
router.post('/', async (req: Request, res: Response) => {
  try {
    const venueData = req.body;
    
    if (!venueData.name || !venueData.address || !venueData.city || !venueData.state || !venueData.zipCode) {
      return res.status(400).json({ error: 'Missing required venue information' });
    }
    
    // Add coordinates if not provided
    if (!venueData.latitude || !venueData.longitude) {
      venueData.latitude = "0";
      venueData.longitude = "0";
    }
    
    const newVenue = await replitDbStorage.createVenue(venueData);
    res.status(201).json(newVenue);
  } catch (error) {
    console.error('Error creating venue:', error);
    res.status(500).json({ error: 'Failed to create venue' });
  }
});

// Update venue - requires authentication
router.patch('/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid venue ID' });
    }
    
    const updates = req.body;
    const updatedVenue = await replitDbStorage.updateVenue(id, updates);
    
    if (!updatedVenue) {
      return res.status(404).json({ error: 'Venue not found' });
    }
    
    res.json(updatedVenue);
  } catch (error) {
    console.error('Error updating venue:', error);
    res.status(500).json({ error: 'Failed to update venue' });
  }
});

// Delete venue - requires authentication
router.delete('/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid venue ID' });
    }
    
    const result = await replitDbStorage.deleteVenue(id);
    
    if (!result) {
      return res.status(404).json({ error: 'Venue not found' });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting venue:', error);
    res.status(500).json({ error: 'Failed to delete venue' });
  }
});

export default router;