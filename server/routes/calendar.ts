import { Router } from 'express';
import { storage } from '../storage';

const router = Router();

// Get events for calendar view
router.get('/', async (req, res) => {
  try {
    const events = await storage.getEvents({});
    res.json(events);
  } catch (error) {
    console.error('Error getting calendar events:', error);
    res.status(500).json({ error: 'Failed to retrieve calendar events' });
  }
});

// Get event details for calendar view
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const event = await storage.getEvent(id);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Error getting calendar event:', error);
    res.status(500).json({ error: 'Failed to retrieve calendar event' });
  }
});

export default router;