import { Express, Request, Response, NextFunction } from "express";
import { Server } from "http";
import { createServer } from "http";
import { storage } from "./storage";
import { 
  insertArtistSchema, 
  insertEventSchema,
  insertCollaborationRequestSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { registerBandsintownRoutes } from "./routes/bandsintown";
import { registerBandsintownDiscoveryRoutes } from "./routes/bandsintown-discovery";
import { registerVenueRoutes } from "./routes/venue-routes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register API-specific routes
  registerBandsintownRoutes(app);
  registerBandsintownDiscoveryRoutes(app);
  registerVenueRoutes(app);

  // Artist routes
  app.get("/api/artists", async (req: Request, res: Response) => {
    try {
      const { genres, limit } = req.query;
      const options: { genres?: string[], limit?: number } = {};
      
      if (genres) {
        options.genres = Array.isArray(genres) 
          ? genres.map(g => g.toString())
          : [genres.toString()];
      }
      
      if (limit) {
        options.limit = parseInt(limit.toString());
      }
      
      const artists = await storage.getArtists(options);
      res.json(artists);
    } catch (error) {
      console.error("Error fetching artists:", error);
      res.status(500).json({ message: "Error fetching artists" });
    }
  });

  app.get("/api/artists/:id", async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const artist = await storage.getArtist(id);
      
      if (!artist) {
        return res.status(404).json({ message: "Artist not found" });
      }
      
      res.json(artist);
    } catch (error) {
      console.error("Error fetching artist:", error);
      res.status(500).json({ message: "Error fetching artist" });
    }
  });

  app.post("/api/artists", async (req: Request, res: Response) => {
    try {
      const validatedData = insertArtistSchema.parse(req.body);
      const artist = await storage.createArtist(validatedData);
      res.status(201).json(artist);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating artist:", error);
      res.status(500).json({ message: "Error creating artist" });
    }
  });

  app.patch("/api/artists/:id", async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const validatedData = insertArtistSchema.partial().parse(req.body);
      const updatedArtist = await storage.updateArtist(id, validatedData);
      
      if (!updatedArtist) {
        return res.status(404).json({ message: "Artist not found" });
      }
      
      res.json(updatedArtist);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error updating artist:", error);
      res.status(500).json({ message: "Error updating artist" });
    }
  });

  app.delete("/api/artists/:id", async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const deleted = await storage.deleteArtist(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Artist not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting artist:", error);
      res.status(500).json({ message: "Error deleting artist" });
    }
  });

  // Event routes
  app.get("/api/events", async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (startDate && endDate) {
        const start = new Date(startDate.toString());
        const end = new Date(endDate.toString());
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          return res.status(400).json({ message: "Invalid date format" });
        }
        
        const events = await storage.getEventsInDateRange(start, end);
        return res.json(events);
      }
      
      // If no date range, get all events (should add pagination in real app)
      const events = await storage.getEventsInDateRange(
        new Date(0), // Beginning of time
        new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000) // 10 years from now
      );
      
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Error fetching events" });
    }
  });

  app.get("/api/artists/:artistId/events", async (req: Request, res: Response) => {
    try {
      const artistId = req.params.artistId;
      const events = await storage.getEventsByArtist(artistId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching artist events:", error);
      res.status(500).json({ message: "Error fetching artist events" });
    }
  });

  app.get("/api/events/:id", async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const event = await storage.getEvent(id);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Error fetching event" });
    }
  });

  app.post("/api/events", async (req: Request, res: Response) => {
    try {
      const validatedData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating event:", error);
      res.status(500).json({ message: "Error creating event" });
    }
  });

  app.patch("/api/events/:id", async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const validatedData = insertEventSchema.partial().parse(req.body);
      const updatedEvent = await storage.updateEvent(id, validatedData);
      
      if (!updatedEvent) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(updatedEvent);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error updating event:", error);
      res.status(500).json({ message: "Error updating event" });
    }
  });

  app.delete("/api/events/:id", async (req: Request, res: Response) => {
    try {
      const id = req.params.id;
      const deleted = await storage.deleteEvent(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ message: "Error deleting event" });
    }
  });

  // Collaboration request routes
  app.get("/api/collaboration-requests", async (req: Request, res: Response) => {
    try {
      const { artistId, type } = req.query;
      
      if (!artistId) {
        return res.status(400).json({ message: "artistId is required" });
      }
      
      const isReceiving = type === 'received';
      const requests = await storage.getCollaborationRequestsByArtist(
        artistId.toString(),
        isReceiving
      );
      
      res.json(requests);
    } catch (error) {
      console.error("Error fetching collaboration requests:", error);
      res.status(500).json({ message: "Error fetching collaboration requests" });
    }
  });

  app.get("/api/collaboration-requests/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const request = await storage.getCollaborationRequest(id);
      
      if (!request) {
        return res.status(404).json({ message: "Collaboration request not found" });
      }
      
      res.json(request);
    } catch (error) {
      console.error("Error fetching collaboration request:", error);
      res.status(500).json({ message: "Error fetching collaboration request" });
    }
  });

  app.post("/api/collaboration-requests", async (req: Request, res: Response) => {
    try {
      const validatedData = insertCollaborationRequestSchema.parse(req.body);
      const request = await storage.createCollaborationRequest(validatedData);
      res.status(201).json(request);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error creating collaboration request:", error);
      res.status(500).json({ message: "Error creating collaboration request" });
    }
  });

  app.patch("/api/collaboration-requests/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const validatedData = insertCollaborationRequestSchema.partial().parse(req.body);
      const updatedRequest = await storage.updateCollaborationRequest(id, validatedData);
      
      if (!updatedRequest) {
        return res.status(404).json({ message: "Collaboration request not found" });
      }
      
      res.json(updatedRequest);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      console.error("Error updating collaboration request:", error);
      res.status(500).json({ message: "Error updating collaboration request" });
    }
  });

  app.delete("/api/collaboration-requests/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const deleted = await storage.deleteCollaborationRequest(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Collaboration request not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting collaboration request:", error);
      res.status(500).json({ message: "Error deleting collaboration request" });
    }
  });

  // Artist compatibility routes
  app.get("/api/artists/:artistId/compatibility", async (req: Request, res: Response) => {
    try {
      const artistId = req.params.artistId;
      const { minScore } = req.query;
      
      let compatibilityThreshold = 50; // Default
      if (minScore && !isNaN(parseInt(minScore.toString()))) {
        compatibilityThreshold = parseInt(minScore.toString());
      }
      
      const compatibleArtists = await storage.getCompatibleArtists(artistId, compatibilityThreshold);
      res.json(compatibleArtists);
    } catch (error) {
      console.error("Error fetching compatible artists:", error);
      res.status(500).json({ message: "Error fetching compatible artists" });
    }
  });

  app.post("/api/artists/calculate-compatibility", async (req: Request, res: Response) => {
    try {
      const { artistId1, artistId2 } = req.body;
      
      if (!artistId1 || !artistId2) {
        return res.status(400).json({ message: "Both artistId1 and artistId2 are required" });
      }
      
      const compatibility = await storage.calculateAndStoreCompatibility(artistId1, artistId2);
      res.status(201).json(compatibility);
    } catch (error) {
      console.error("Error calculating compatibility:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Error calculating compatibility" 
      });
    }
  });

  // Discovery routes
  app.get("/api/artists/near-location", async (req: Request, res: Response) => {
    try {
      const { lat, lng, radius, date } = req.query;
      
      if (!lat || !lng || !radius) {
        return res.status(400).json({ 
          message: "Latitude, longitude, and radius are required" 
        });
      }
      
      const latitude = parseFloat(lat.toString());
      const longitude = parseFloat(lng.toString());
      const radiusValue = parseFloat(radius.toString());
      
      if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusValue)) {
        return res.status(400).json({ message: "Invalid coordinate or radius format" });
      }
      
      let dateValue: Date | undefined;
      if (date) {
        dateValue = new Date(date.toString());
        if (isNaN(dateValue.getTime())) {
          return res.status(400).json({ message: "Invalid date format" });
        }
      }
      
      const artists = await storage.findArtistsNearLocation(
        latitude,
        longitude,
        radiusValue,
        dateValue
      );
      
      res.json(artists);
    } catch (error) {
      console.error("Error finding artists near location:", error);
      res.status(500).json({ message: "Error finding artists near location" });
    }
  });

  app.get("/api/artists/:artistId/collaboration-opportunities", async (req: Request, res: Response) => {
    try {
      const artistId = req.params.artistId;
      const { maxDistance } = req.query;
      
      let distanceValue: number | undefined;
      if (maxDistance) {
        distanceValue = parseFloat(maxDistance.toString());
        if (isNaN(distanceValue)) {
          return res.status(400).json({ message: "Invalid maxDistance format" });
        }
      }
      
      const opportunities = await storage.findCollaborationOpportunities(
        artistId,
        distanceValue
      );
      
      res.json(opportunities);
    } catch (error) {
      console.error("Error finding collaboration opportunities:", error);
      res.status(500).json({ message: "Error finding collaboration opportunities" });
    }
  });

  app.get("/api/artists/:artistId/statistics", async (req: Request, res: Response) => {
    try {
      const artistId = req.params.artistId;
      const stats = await storage.getArtistStatistics(artistId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching artist statistics:", error);
      res.status(500).json({ message: "Error fetching artist statistics" });
    }
  });

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ message: "Internal server error" });
  });

  const httpServer = createServer(app);
  return httpServer;
}