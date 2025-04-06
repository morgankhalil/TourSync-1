import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { fromZodError } from "zod-validation-error";
import { z } from "zod";

// Schema for past performance
const pastPerformanceSchema = z.object({
  id: z.string(),
  artistName: z.string(),
  date: z.string(), // ISO date string
  genre: z.string().optional(),
  drawSize: z.number().optional(),
  ticketPrice: z.number().optional(),
  notes: z.string().optional(),
  poster: z.string().optional(),
  isSoldOut: z.boolean().optional(),
  isHeadliner: z.boolean().optional()
});

// Schema for add performance request
const addPerformanceSchema = pastPerformanceSchema.omit({ id: true });

// Schema for a list of past performances
const pastPerformancesSchema = z.array(pastPerformanceSchema);

/**
 * Register routes for managing venue past performances
 */
export function registerVenuePerformancesRoutes(app: Express): void {
  // Get all past performances for a venue
  app.get("/api/venues/:id/performances", async (req: Request, res: Response) => {
    try {
      const venueId = parseInt(req.params.id);
      const venue = await storage.getVenue(venueId);
      
      if (!venue) {
        return res.status(404).json({ message: "Venue not found" });
      }
      
      // Return the past performances if they exist, otherwise return an empty array
      const pastPerformers = Array.isArray(venue.pastPerformers) ? venue.pastPerformers : [];
      res.json(pastPerformers);
    } catch (error) {
      console.error("Error fetching venue past performances:", error);
      res.status(500).json({ message: "Error fetching venue past performances" });
    }
  });

  // Add a past performance to a venue
  app.post("/api/venues/:id/performances", async (req: Request, res: Response) => {
    try {
      const venueId = parseInt(req.params.id);
      const venue = await storage.getVenue(venueId);
      
      if (!venue) {
        return res.status(404).json({ message: "Venue not found" });
      }

      // Validate the performance data
      const performanceData = addPerformanceSchema.parse(req.body);
      
      // Generate a unique ID for the performance
      const id = `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create the new performance object
      const newPerformance = {
        id,
        ...performanceData
      };
      
      // Get existing performances or initialize empty array
      const currentPerformances = Array.isArray(venue.pastPerformers) ? [...venue.pastPerformers] : [];
      
      // Add the new performance
      currentPerformances.push(newPerformance);
      
      // Update the venue
      const updatedVenue = await storage.updateVenue(venueId, {
        pastPerformers: currentPerformances
      });
      
      if (!updatedVenue) {
        return res.status(500).json({ message: "Failed to update venue" });
      }
      
      res.status(201).json(newPerformance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error adding past performance:", error);
      res.status(500).json({ message: "Error adding past performance" });
    }
  });

  // Update a past performance
  app.put("/api/venues/:venueId/performances/:performanceId", async (req: Request, res: Response) => {
    try {
      const venueId = parseInt(req.params.venueId);
      const performanceId = req.params.performanceId;
      
      const venue = await storage.getVenue(venueId);
      
      if (!venue) {
        return res.status(404).json({ message: "Venue not found" });
      }
      
      // Ensure pastPerformers is an array
      if (!Array.isArray(venue.pastPerformers)) {
        return res.status(404).json({ message: "No performances found for this venue" });
      }
      
      // Validate the update data
      const updateData = pastPerformanceSchema.partial().parse(req.body);
      
      // Find the performance to update
      const performances = [...venue.pastPerformers];
      const performanceIndex = performances.findIndex((p: any) => p.id === performanceId);
      
      if (performanceIndex === -1) {
        return res.status(404).json({ message: "Performance not found" });
      }
      
      // Update the performance
      performances[performanceIndex] = {
        ...performances[performanceIndex],
        ...updateData
      };
      
      // Update the venue
      const updatedVenue = await storage.updateVenue(venueId, {
        pastPerformers: performances
      });
      
      if (!updatedVenue) {
        return res.status(500).json({ message: "Failed to update venue" });
      }
      
      res.json(performances[performanceIndex]);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error updating past performance:", error);
      res.status(500).json({ message: "Error updating past performance" });
    }
  });

  // Delete a past performance
  app.delete("/api/venues/:venueId/performances/:performanceId", async (req: Request, res: Response) => {
    try {
      const venueId = parseInt(req.params.venueId);
      const performanceId = req.params.performanceId;
      
      const venue = await storage.getVenue(venueId);
      
      if (!venue) {
        return res.status(404).json({ message: "Venue not found" });
      }
      
      // Ensure pastPerformers is an array
      if (!Array.isArray(venue.pastPerformers)) {
        return res.status(404).json({ message: "No performances found for this venue" });
      }
      
      // Filter out the performance to delete
      const updatedPerformances = venue.pastPerformers.filter((p: any) => p.id !== performanceId);
      
      // Check if any performance was removed
      if (updatedPerformances.length === venue.pastPerformers.length) {
        return res.status(404).json({ message: "Performance not found" });
      }
      
      // Update the venue
      const updatedVenue = await storage.updateVenue(venueId, {
        pastPerformers: updatedPerformances
      });
      
      if (!updatedVenue) {
        return res.status(500).json({ message: "Failed to update venue" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting past performance:", error);
      res.status(500).json({ message: "Error deleting past performance" });
    }
  });

  // Import performances in batch
  app.post("/api/venues/:id/performances/batch", async (req: Request, res: Response) => {
    try {
      const venueId = parseInt(req.params.id);
      const venue = await storage.getVenue(venueId);
      
      if (!venue) {
        return res.status(404).json({ message: "Venue not found" });
      }

      // Validate the performances data
      const performancesData = z.array(addPerformanceSchema).parse(req.body);
      
      // Generate unique IDs for each performance
      const newPerformances = performancesData.map(perf => ({
        id: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...perf
      }));
      
      // Get existing performances or initialize empty array
      const currentPerformances = Array.isArray(venue.pastPerformers) ? [...venue.pastPerformers] : [];
      
      // Add the new performances
      const updatedPerformances = [...currentPerformances, ...newPerformances];
      
      // Update the venue
      const updatedVenue = await storage.updateVenue(venueId, {
        pastPerformers: updatedPerformances
      });
      
      if (!updatedVenue) {
        return res.status(500).json({ message: "Failed to update venue" });
      }
      
      res.status(201).json(newPerformances);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error adding batch performances:", error);
      res.status(500).json({ message: "Error adding batch performances" });
    }
  });
}