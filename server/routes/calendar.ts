
import { Router } from 'express';
import ical from 'ical-generator';
import { storage } from '../storage';

const router = Router();

// Export tour dates to iCal
router.get('/tours/:id/calendar', async (req, res) => {
  try {
    const tourId = parseInt(req.params.id);
    const tour = await storage.getTour(tourId);
    const dates = await storage.getTourDates(tourId);
    
    const calendar = ical({name: tour?.name});
    
    dates.forEach(date => {
      calendar.createEvent({
        start: new Date(date.date),
        summary: `${tour?.name} - ${date.city}, ${date.state}`,
        description: date.notes,
        location: date.venueName
      });
    });
    
    res.set('Content-Type', 'text/calendar');
    res.send(calendar.toString());
  } catch (error) {
    res.status(500).json({ message: "Error exporting calendar" });
  }
});

// Handle calendar webhook updates
router.post('/venues/:id/calendar-sync', async (req, res) => {
  try {
    const venueId = parseInt(req.params.id);
    const { events } = req.body;
    
    await Promise.all(events.map(event => 
      storage.createVenueAvailability({
        venueId,
        date: new Date(event.start),
        isAvailable: !event.busy
      })
    ));
    
    res.status(200).json({ message: "Calendar sync successful" });
  } catch (error) {
    res.status(500).json({ message: "Error syncing calendar" });
  }
});

export default router;
