import express from 'express';
import { addDays, format, parse, parseISO } from 'date-fns';

const router = express.Router();

// Sample venue data
const sampleVenues = [
  {
    id: "venue1",
    name: "The Empty Bottle",
    address: "1035 N Western Ave",
    city: "Chicago",
    state: "IL",
    country: "USA",
    capacity: 400,
    imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
    website: "https://www.emptybottle.com/",
    email: "contact@emptybottle.com",
    phone: "(773) 276-3600",
    description: "The Empty Bottle is a bar and music venue in Chicago, Illinois that features primarily indie rock, but also a wide variety of other genres.",
    latitude: 41.9006,
    longitude: -87.6868,
    createdAt: new Date("2023-01-15")
  },
  {
    id: "venue2",
    name: "Metro Chicago",
    address: "3730 N Clark St",
    city: "Chicago",
    state: "IL",
    country: "USA",
    capacity: 1100,
    imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
    website: "https://metrochicago.com/",
    email: "contact@metrochicago.com",
    phone: "(773) 549-4140",
    description: "The Metro is a concert hall at 3730 North Clark Street in Chicago, Illinois that plays host to a variety of local, regional and national emerging bands and musicians.",
    latitude: 41.9499,
    longitude: -87.6583,
    createdAt: new Date("2023-02-10")
  },
  {
    id: "venue3",
    name: "The Hideout",
    address: "1354 W Wabansia Ave",
    city: "Chicago",
    state: "IL",
    country: "USA",
    capacity: 150,
    imageUrl: "https://images.unsplash.com/photo-1528722828814-77b9b83aafb2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
    website: "https://www.hideoutchicago.com/",
    email: "contact@hideoutchicago.com",
    phone: "(773) 227-4433",
    description: "The Hideout is a bar and music venue in Chicago, Illinois. It features a variety of music genres.",
    latitude: 41.9136,
    longitude: -87.6608,
    createdAt: new Date("2023-03-05")
  }
];

// Sample event data
const sampleVenueEvents = [
  {
    id: "event1",
    venueId: "venue1",
    eventDate: new Date("2025-04-15"),
    eventName: "Jazz Night",
    available: false
  },
  {
    id: "event2",
    venueId: "venue1",
    eventDate: new Date("2025-04-20"),
    eventName: "Rock Concert",
    available: false
  },
  {
    id: "event3",
    venueId: "venue2",
    eventDate: new Date("2025-04-18"),
    eventName: "EDM Festival",
    available: false
  }
];

// Get all venues
router.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'max-age=60');
  res.json(sampleVenues);
});

// Get venue by ID
router.get('/:id', (req, res) => {
  const id = req.params.id;
  const venue = sampleVenues.find(v => v.id === id);
  
  if (!venue) {
    return res.status(404).json({ message: "Venue not found" });
  }
  
  res.json(venue);
});

// Get venue availability
router.get('/:id/availability', (req, res) => {
  const id = req.params.id;
  const venue = sampleVenues.find(v => v.id === id);
  
  if (!venue) {
    return res.status(404).json({ message: "Venue not found" });
  }
  
  // Parse start and end dates from query params
  const startDateStr = req.query.startDate as string;
  const endDateStr = req.query.endDate as string;
  
  if (!startDateStr || !endDateStr) {
    return res.status(400).json({ message: "startDate and endDate query parameters are required" });
  }
  
  try {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    
    // Generate availability data
    const dates = [];
    let currentDate = startDate;
    
    while (currentDate <= endDate) {
      const formattedDate = format(currentDate, 'yyyy-MM-dd');
      const existingEvent = sampleVenueEvents.find(event => 
        event.venueId === id && 
        format(event.eventDate, 'yyyy-MM-dd') === formattedDate
      );
      
      dates.push({
        date: formattedDate,
        available: !existingEvent,
        eventId: existingEvent?.id
      });
      
      currentDate = addDays(currentDate, 1);
    }
    
    res.json({ dates });
  } catch (error) {
    console.error("Error processing dates:", error);
    res.status(400).json({ message: "Invalid date format" });
  }
});

// POST new venue
router.post('/', (req, res) => {
  const venue = req.body;
  
  // Basic validation
  if (!venue.name) {
    return res.status(400).json({ message: "Venue name is required" });
  }
  
  // Generate ID and add created date
  const newVenue = {
    ...venue,
    id: `venue${sampleVenues.length + 1}`,
    createdAt: new Date()
  };
  
  sampleVenues.push(newVenue);
  res.status(201).json(newVenue);
});

// Update venue
router.patch('/:id', (req, res) => {
  const id = req.params.id;
  const venueIndex = sampleVenues.findIndex(v => v.id === id);
  
  if (venueIndex === -1) {
    return res.status(404).json({ message: "Venue not found" });
  }
  
  const updatedVenue = {
    ...sampleVenues[venueIndex],
    ...req.body,
    id // Ensure ID doesn't change
  };
  
  sampleVenues[venueIndex] = updatedVenue;
  res.json(updatedVenue);
});

// Delete venue
router.delete('/:id', (req, res) => {
  const id = req.params.id;
  const venueIndex = sampleVenues.findIndex(v => v.id === id);
  
  if (venueIndex === -1) {
    return res.status(404).json({ message: "Venue not found" });
  }
  
  sampleVenues.splice(venueIndex, 1);
  res.status(204).send();
});

export default router;