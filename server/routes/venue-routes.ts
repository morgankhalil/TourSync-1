import { Express, Request, Response } from "express";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { z } from "zod";

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

const venueSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  country: z.string(),
  capacity: z.number(),
  imageUrl: z.string().optional(),
  website: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  description: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  createdAt: z.date().optional()
});

export function registerVenueRoutes(app: Express) {
  // Get all venues
  app.get("/api/venues", (_req: Request, res: Response) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      res.json(sampleVenues);
    } catch (error) {
      console.error("Error fetching venues:", error);
      res.status(500).json({ message: "Error fetching venues" });
    }
  });

  // Get venue by ID
  app.get("/api/venues/:id", (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const venue = sampleVenues.find(v => v.id === id);
      
      if (!venue) {
        return res.status(404).json({ message: "Venue not found" });
      }
      
      res.setHeader('Content-Type', 'application/json');
      res.json(venue);
    } catch (error) {
      console.error("Error fetching venue:", error);
      res.status(500).json({ message: "Error fetching venue" });
    }
  });

  // Create venue (we'll just return a success response)
  app.post("/api/venues", (req: Request, res: Response) => {
    try {
      const validatedData = venueSchema.parse(req.body);
      
      // In a real app we would save to database
      // For now, just return a success message
      const newVenue = {
        ...validatedData,
        id: `venue${sampleVenues.length + 1}`,
        createdAt: new Date()
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.status(201).json(newVenue);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating venue:", error);
      res.status(500).json({ message: "Error creating venue" });
    }
  });

  // Update venue (we'll just return a success response)
  app.patch("/api/venues/:id", (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const venue = sampleVenues.find(v => v.id === id);
      
      if (!venue) {
        return res.status(404).json({ message: "Venue not found" });
      }
      
      const validatedData = venueSchema.partial().parse(req.body);
      
      // In a real app we would update in database
      const updatedVenue = { ...venue, ...validatedData };
      
      res.setHeader('Content-Type', 'application/json');
      res.json(updatedVenue);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error updating venue:", error);
      res.status(500).json({ message: "Error updating venue" });
    }
  });

  // Delete venue (we'll just return a success response)
  app.delete("/api/venues/:id", (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const venue = sampleVenues.find(v => v.id === id);
      
      if (!venue) {
        return res.status(404).json({ message: "Venue not found" });
      }
      
      // In a real app we would delete from database
      
      res.setHeader('Content-Type', 'application/json');
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting venue:", error);
      res.status(500).json({ message: "Error deleting venue" });
    }
  });
}