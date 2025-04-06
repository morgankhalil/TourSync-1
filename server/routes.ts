import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertBandSchema, insertTourSchema, insertTourDateSchema, insertVenueSchema, insertVenueAvailabilitySchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { registerTouringRoutes } from "./routes/touring";
import { registerBandsintownRoutes } from "./routes/bandsintown";
import { registerConfigRoutes } from "./routes/config";
import { registerVenuePerformancesRoutes } from "./routes/venue-performances";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register touring routes from dedicated module
  registerTouringRoutes(app);
  
  // Register Bandsintown integration routes
  registerBandsintownRoutes(app);
  
  // Register configuration routes
  registerConfigRoutes(app);
  
  // Register venue performances routes
  registerVenuePerformancesRoutes(app);
  
  // Band routes
  app.get("/api/bands", async (_req, res) => {
    try {
      const bands = await storage.getBands();
      res.json(bands);
    } catch (error) {
      console.error("Error fetching bands:", error);
      res.status(500).json({ message: "Error fetching bands" });
    }
  });

  app.get("/api/bands/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const band = await storage.getBand(id);
      
      if (!band) {
        return res.status(404).json({ message: "Band not found" });
      }
      
      res.json(band);
    } catch (error) {
      console.error("Error fetching band:", error);
      res.status(500).json({ message: "Error fetching band" });
    }
  });

  app.post("/api/bands", async (req, res) => {
    try {
      const validatedData = insertBandSchema.parse(req.body);
      const band = await storage.createBand(validatedData);
      res.status(201).json(band);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error creating band:", error);
      res.status(500).json({ message: "Error creating band" });
    }
  });

  app.put("/api/bands/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertBandSchema.partial().parse(req.body);
      const updatedBand = await storage.updateBand(id, validatedData);
      
      if (!updatedBand) {
        return res.status(404).json({ message: "Band not found" });
      }
      
      res.json(updatedBand);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error updating band:", error);
      res.status(500).json({ message: "Error updating band" });
    }
  });

  app.delete("/api/bands/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteBand(id);
      
      if (!success) {
        return res.status(404).json({ message: "Band not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting band:", error);
      res.status(500).json({ message: "Error deleting band" });
    }
  });

  // Venue routes
  app.get("/api/venues", async (req, res) => {
    try {
      // Check if location-based search parameters are provided
      if (req.query.lat && req.query.lng && req.query.radius) {
        const lat = parseFloat(req.query.lat as string);
        const lng = parseFloat(req.query.lng as string);
        const radius = parseFloat(req.query.radius as string);
        
        const venues = await storage.getVenuesByLocation(lat, lng, radius);
        return res.json(venues);
      }
      
      const venues = await storage.getVenues();
      res.json(venues);
    } catch (error) {
      console.error("Error fetching venues:", error);
      res.status(500).json({ message: "Error fetching venues" });
    }
  });

  app.get("/api/venues/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const venue = await storage.getVenue(id);
      
      if (!venue) {
        return res.status(404).json({ message: "Venue not found" });
      }
      
      res.json(venue);
    } catch (error) {
      console.error("Error fetching venue:", error);
      res.status(500).json({ message: "Error fetching venue" });
    }
  });

  app.post("/api/venues", async (req, res) => {
    try {
      const validatedData = insertVenueSchema.parse(req.body);
      const venue = await storage.createVenue(validatedData);
      res.status(201).json(venue);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error creating venue:", error);
      res.status(500).json({ message: "Error creating venue" });
    }
  });

  app.put("/api/venues/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertVenueSchema.partial().parse(req.body);
      const updatedVenue = await storage.updateVenue(id, validatedData);
      
      if (!updatedVenue) {
        return res.status(404).json({ message: "Venue not found" });
      }
      
      res.json(updatedVenue);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error updating venue:", error);
      res.status(500).json({ message: "Error updating venue" });
    }
  });

  app.delete("/api/venues/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteVenue(id);
      
      if (!success) {
        return res.status(404).json({ message: "Venue not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting venue:", error);
      res.status(500).json({ message: "Error deleting venue" });
    }
  });

  // Cache storage
  const cache: Record<string, { timestamp: number; data: any }> = {};
  const CACHE_DURATION = 60000; // 60 seconds

  // Tour routes
  app.get("/api/tours", async (req, res) => {
    try {
      const bandId = req.query.bandId ? parseInt(req.query.bandId as string) : undefined;
      const cacheKey = `tours_${bandId || 'all'}`;

      // Check cache
      if (cache[cacheKey] && (Date.now() - cache[cacheKey].timestamp < CACHE_DURATION)) {
        return res.json(cache[cacheKey].data);
      }

      const tours = await storage.getTours(bandId);
      
      // Update cache
      cache[cacheKey] = {
        timestamp: Date.now(),
        data: tours,
      };
      
      res.json(tours);
    } catch (error) {
      console.error("Error fetching tours:", error);
      res.status(500).json({ message: "Error fetching tours" });
    }
  });
  
  // Get all tour dates across all tours (for venue view)
  app.get("/api/tours/all-dates", async (req, res) => {
    try {
      console.log("Fetching all tour dates");
      // Get all tours
      const tours = await storage.getTours();
      console.log("Tours fetched:", tours.length);
      
      if (!tours || tours.length === 0) {
        console.log("No tours found, returning empty array");
        return res.json([]);
      }
      
      // Get dates for each tour and combine them
      const allDatePromises = tours.map(async (tour) => {
        // Ensure we have a valid tour id
        if (!tour || isNaN(tour.id)) {
          console.warn("Invalid tour ID encountered:", tour);
          return [];
        }
        try {
          const dates = await storage.getTourDates(tour.id);
          console.log(`Fetched ${dates.length} dates for tour ${tour.id}`);
          return dates;
        } catch (err) {
          console.error(`Error fetching dates for tour ${tour.id}:`, err);
          return [];
        }
      });
      
      const allDatesArrays = await Promise.all(allDatePromises);
      console.log("All date arrays fetched:", allDatesArrays.length);
      
      // Flatten the array of arrays
      const allDates = allDatesArrays.flat();
      console.log("Total dates found:", allDates.length);
      
      return res.json(allDates);
    } catch (error) {
      console.error("Error fetching all tour dates:", error);
      res.status(500).json({ message: "Error fetching all tour dates" });
    }
  });

  app.get("/api/tours/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const tour = await storage.getTour(id);
      
      if (!tour) {
        return res.status(404).json({ message: "Tour not found" });
      }
      
      res.json(tour);
    } catch (error) {
      console.error("Error fetching tour:", error);
      res.status(500).json({ message: "Error fetching tour" });
    }
  });

  app.post("/api/tours", async (req, res) => {
    try {
      const validatedData = insertTourSchema.parse(req.body);
      const tour = await storage.createTour(validatedData);
      res.status(201).json(tour);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error creating tour:", error);
      res.status(500).json({ message: "Error creating tour" });
    }
  });

  app.put("/api/tours/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertTourSchema.partial().parse(req.body);
      const updatedTour = await storage.updateTour(id, validatedData);
      
      if (!updatedTour) {
        return res.status(404).json({ message: "Tour not found" });
      }
      
      res.json(updatedTour);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error updating tour:", error);
      res.status(500).json({ message: "Error updating tour" });
    }
  });

  app.delete("/api/tours/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTour(id);
      
      if (!success) {
        return res.status(404).json({ message: "Tour not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting tour:", error);
      res.status(500).json({ message: "Error deleting tour" });
    }
  });

  // Tour date routes
  app.get("/api/tours/:tourId/dates", async (req, res) => {
    try {
      const tourId = parseInt(req.params.tourId);
      const tourDates = await storage.getTourDates(tourId);
      res.json(tourDates);
    } catch (error) {
      console.error("Error fetching tour dates:", error);
      res.status(500).json({ message: "Error fetching tour dates" });
    }
  });

  app.get("/api/tour-dates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const tourDate = await storage.getTourDate(id);
      
      if (!tourDate) {
        return res.status(404).json({ message: "Tour date not found" });
      }
      
      res.json(tourDate);
    } catch (error) {
      console.error("Error fetching tour date:", error);
      res.status(500).json({ message: "Error fetching tour date" });
    }
  });

  app.post("/api/tour-dates", async (req, res) => {
    try {
      const validatedData = insertTourDateSchema.parse(req.body);
      const tourDate = await storage.createTourDate(validatedData);
      res.status(201).json(tourDate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error creating tour date:", error);
      res.status(500).json({ message: "Error creating tour date" });
    }
  });

  app.put("/api/tour-dates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertTourDateSchema.partial().parse(req.body);
      const updatedTourDate = await storage.updateTourDate(id, validatedData);
      
      if (!updatedTourDate) {
        return res.status(404).json({ message: "Tour date not found" });
      }
      
      res.json(updatedTourDate);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error updating tour date:", error);
      res.status(500).json({ message: "Error updating tour date" });
    }
  });

  app.delete("/api/tour-dates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTourDate(id);
      
      if (!success) {
        return res.status(404).json({ message: "Tour date not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting tour date:", error);
      res.status(500).json({ message: "Error deleting tour date" });
    }
  });

  // Venue availability routes
  app.get("/api/venues/:venueId/availability", async (req, res) => {
    try {
      const venueId = parseInt(req.params.venueId);
      const availabilities = await storage.getVenueAvailability(venueId);
      res.json(availabilities);
    } catch (error) {
      console.error("Error fetching venue availability:", error);
      res.status(500).json({ message: "Error fetching venue availability" });
    }
  });

  app.post("/api/venue-availability", async (req, res) => {
    try {
      const validatedData = insertVenueAvailabilitySchema.parse(req.body);
      const availability = await storage.createVenueAvailability(validatedData);
      res.status(201).json(availability);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error creating venue availability:", error);
      res.status(500).json({ message: "Error creating venue availability" });
    }
  });

  app.put("/api/venue-availability/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertVenueAvailabilitySchema.partial().parse(req.body);
      const updatedAvailability = await storage.updateVenueAvailability(id, validatedData);
      
      if (!updatedAvailability) {
        return res.status(404).json({ message: "Venue availability not found" });
      }
      
      res.json(updatedAvailability);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error updating venue availability:", error);
      res.status(500).json({ message: "Error updating venue availability" });
    }
  });

  app.delete("/api/venue-availability/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteVenueAvailability(id);
      
      if (!success) {
        return res.status(404).json({ message: "Venue availability not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting venue availability:", error);
      res.status(500).json({ message: "Error deleting venue availability" });
    }
  });
  
  // Get tour dates associated with a specific venue
  app.get("/api/venues/:id/tour-dates", async (req, res) => {
    try {
      const venueId = parseInt(req.params.id);
      
      // Get all tours
      const tours = await storage.getTours();
      
      // Get all tour dates
      const allDatePromises = tours.map(tour => {
        // Ensure we have a valid tour id
        if (!tour || isNaN(tour.id)) {
          console.warn("Invalid tour ID encountered:", tour);
          return Promise.resolve([]);
        }
        return storage.getTourDates(tour.id);
      });
      
      const allDatesArrays = await Promise.all(allDatePromises);
      const allDates = allDatesArrays.flat();
      
      // Filter dates for the specified venue
      const venueDates = allDates.filter(date => date.venueId === venueId);
      
      res.json(venueDates);
    } catch (error) {
      console.error("Error fetching venue tour dates:", error);
      res.status(500).json({ message: "Error fetching venue tour dates" });
    }
  });
  
  // Get tours that are near a specific venue
  app.get("/api/venues/:id/nearby-tours", async (req, res) => {
    try {
      const venueId = parseInt(req.params.id);
      const venue = await storage.getVenue(venueId);
      
      if (!venue) {
        return res.status(404).json({ message: "Venue not found" });
      }
      
      // Default radius in miles
      const radius = req.query.radius ? parseFloat(req.query.radius as string) : 100;
      
      // Fetch tours with venues along a route that's near this venue
      const lat = parseFloat(venue.latitude);
      const lng = parseFloat(venue.longitude);
      
      // Get all tours
      const allTours = await storage.getTours();
      
      // For each tour, check if it has any venues near this venue
      const nearbyToursPromises = allTours.map(async (tour) => {
        // Skip tours with invalid IDs
        if (!tour || isNaN(tour.id)) {
          console.warn("Invalid tour ID encountered:", tour);
          return null;
        }
        
        const tourDates = await storage.getTourDates(tour.id);
        
        // Check if this tour has any dates with venues near our venue
        const hasNearbyVenue = tourDates.some(date => {
          if (!date.venueId) return false;
          
          // For demo purposes, we'll include all tours - in a real implementation,
          // you'd check the actual distance between venue coordinates
          return true;
        });
        
        return hasNearbyVenue ? tour : null;
      });
      
      const nearbyToursWithNulls = await Promise.all(nearbyToursPromises);
      const nearbyTours = nearbyToursWithNulls.filter(tour => tour !== null);
      
      res.json(nearbyTours);
    } catch (error) {
      console.error("Error fetching nearby tours:", error);
      res.status(500).json({ message: "Error fetching nearby tours" });
    }
  });

  // Specialized routes
  app.get("/api/tours/:id/stats", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const stats = await storage.getTourStats(id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching tour stats:", error);
      res.status(500).json({ message: "Error fetching tour stats" });
    }
  });

  app.post("/api/venues/find-along-route", async (req, res) => {
    try {
      const schema = z.object({
        waypoints: z.array(z.object({
          lat: z.number(),
          lng: z.number()
        })),
        radius: z.number().default(50)
      });
      
      const { waypoints, radius } = schema.parse(req.body);
      const venues = await storage.findVenuesAlongRoute(waypoints, radius);
      res.json(venues);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error finding venues along route:", error);
      res.status(500).json({ message: "Error finding venues along route" });
    }
  });

  app.post("/api/venues/find-between-dates", async (req, res) => {
    try {
      const schema = z.object({
        startDate: z.string().transform(val => new Date(val)),
        endDate: z.string().transform(val => new Date(val)),
        startLat: z.number(),
        startLng: z.number(),
        endLat: z.number(),
        endLng: z.number(),
        radius: z.number().default(100)
      });
      
      const { startDate, endDate, startLat, startLng, endLat, endLng, radius } = schema.parse(req.body);
      const venues = await storage.findAvailableVenuesBetweenDates(
        startDate,
        endDate,
        startLat,
        startLng,
        endLat,
        endLng,
        radius
      );
      
      res.json(venues);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error finding venues between dates:", error);
      res.status(500).json({ message: "Error finding venues between dates" });
    }
  });
  
  // Tour Optimization Routes
  
  // Find venues near an existing venue
  app.get("/api/venues/:id/nearby", async (req, res) => {
    try {
      const venueId = parseInt(req.params.id);
      const radius = req.query.radius ? parseFloat(req.query.radius as string) : 50;
      const excludeIdsParam = req.query.excludeIds as string;
      const excludeIds = excludeIdsParam ? excludeIdsParam.split(",").map(id => parseInt(id.trim())) : [];
      
      let venues = await storage.findVenuesNearExistingVenue(venueId, radius, excludeIds);
      
      // If no venues found, return all venues except excluded ones and the current one
      if (venues.length === 0) {
        const allVenues = await storage.getVenues();
        venues = allVenues.filter(v => 
          v.id !== venueId && 
          !excludeIds.includes(v.id)
        );
      }
      
      res.json(venues);
    } catch (error) {
      console.error("Error finding nearby venues:", error);
      res.status(500).json({ message: "Error finding nearby venues" });
    }
  });
  
  // Find gaps in a tour schedule
  app.get("/api/tours/:id/gaps", async (req, res) => {
    try {
      const tourId = parseInt(req.params.id);
      const minGapDays = req.query.minDays ? parseInt(req.query.minDays as string) : 2;
      
      const gaps = await storage.findTourGaps(tourId, minGapDays);
      res.json(gaps);
    } catch (error) {
      console.error("Error finding tour gaps:", error);
      res.status(500).json({ message: "Error finding tour gaps" });
    }
  });
  
  // Find venues to fill a gap in a tour
  app.post("/api/tours/:id/fill-gap", async (req, res) => {
    try {
      const schema = z.object({
        gapStartDate: z.string().transform(val => new Date(val)),
        gapEndDate: z.string().transform(val => new Date(val)),
        radius: z.number().default(50)
      });
      
      const tourId = parseInt(req.params.id);
      const { gapStartDate, gapEndDate, radius } = schema.parse(req.body);
      
      let venues = await storage.findVenuesForTourGap(tourId, gapStartDate, gapEndDate, radius);
      
      // If no venues found, return all venues except those already in the tour
      if (venues.length === 0) {
        const allVenues = await storage.getVenues();
        const tourDates = await storage.getTourDates(tourId);
        const tourVenueIds = tourDates
          .filter(td => td.venueId !== undefined)
          .map(td => td.venueId as number);
        
        venues = allVenues.filter(venue => !tourVenueIds.includes(venue.id));
      }
      
      res.json(venues);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error finding venues for tour gap:", error);
      res.status(500).json({ message: "Error finding venues for tour gap" });
    }
  });

  // Venue availability page endpoint
  app.get("/venue-availability", (_req, res) => {
    res.sendFile("index.html", { root: "./client" });
  });

  // Google Maps API key endpoint
  app.get("/api/maps/api-key", (_req, res) => {
    try {
      const apiKey = process.env.GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.error('Missing GOOGLE_MAPS_API_KEY in environment variables');
        return res.status(500).json({ message: "Google Maps API key is not configured" });
      }
      res.json({ apiKey });
    } catch (error) {
      console.error("Error fetching Google Maps API key:", error);
      res.status(500).json({ message: "Error fetching Google Maps API key" });
    }
  });

  // Touring bands endpoint now comes from dedicated module
  // Previously defined at this location

  // Google Maps API key endpoint
  app.get("/api/maps/api-key", (_req, res) => {
    // In a real application, this would be stored in environment variables
    // For demonstration purposes, we're returning a placeholder
    // The user would need to add their own API key
    res.json({ apiKey: process.env.GOOGLE_MAPS_API_KEY || "" });
  });

  const httpServer = createServer(app);
  return httpServer;
}