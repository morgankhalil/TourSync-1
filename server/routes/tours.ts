import { Express, Request, Response } from "express";
import { db } from "../db";
import { tours, tourDates, venues } from "../../shared/schema";
import { eq } from "drizzle-orm";

export function registerTourRoutes(app: Express): void {
  // Get all tours
  app.get("/api/tours", async (_req: Request, res: Response) => {
    try {
      const result = await db.select().from(tours);
      res.json(result);
    } catch (error) {
      console.error("Error fetching tours:", error);
      res.status(500).json({ error: "Failed to fetch tours" });
    }
  });

  // Get a specific tour by ID
  app.get("/api/tours/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid tour ID" });
      }

      const result = await db.select().from(tours).where(eq(tours.id, id));
      
      if (result.length === 0) {
        return res.status(404).json({ error: "Tour not found" });
      }
      
      res.json(result[0]);
    } catch (error) {
      console.error(`Error fetching tour ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to fetch tour" });
    }
  });

  // Get all tour dates for a specific tour
  app.get("/api/tours/:id/dates", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid tour ID" });
      }

      const result = await db.select().from(tourDates).where(eq(tourDates.tourId, id));
      res.json(result);
    } catch (error) {
      console.error(`Error fetching tour dates for tour ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to fetch tour dates" });
    }
  });

  // Get venue information for a tour date
  app.get("/api/tour-dates/:id/venue", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid tour date ID" });
      }

      const tourDateResult = await db.select().from(tourDates).where(eq(tourDates.id, id));
      
      if (tourDateResult.length === 0) {
        return res.status(404).json({ error: "Tour date not found" });
      }
      
      const tourDate = tourDateResult[0];
      
      if (!tourDate.venueId) {
        return res.status(404).json({ error: "No venue associated with this tour date" });
      }
      
      const venueResult = await db.select().from(venues).where(eq(venues.id, tourDate.venueId));
      
      if (venueResult.length === 0) {
        return res.status(404).json({ error: "Venue not found" });
      }
      
      res.json(venueResult[0]);
    } catch (error) {
      console.error(`Error fetching venue for tour date ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to fetch venue" });
    }
  });

  // Get route information (coordinates and distances) for a tour
  app.get("/api/tours/:id/route", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid tour ID" });
      }

      // Get all tour dates for this tour
      const tourDateResults = await db.select().from(tourDates).where(eq(tourDates.tourId, id));
      
      if (tourDateResults.length === 0) {
        return res.json({ coordinates: [], totalDistance: 0, legs: [] });
      }
      
      // Sort tour dates by date
      const sortedDates = [...tourDateResults].sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });
      
      // For each venue, get coordinates
      const coordinates: { lat: number; lng: number; city: string; state: string; venueName?: string }[] = [];
      const legs: { from: string; to: string; distance: number }[] = [];
      let totalDistance = 0;
      
      // Process each tour date
      for (let i = 0; i < sortedDates.length; i++) {
        const date = sortedDates[i];
        
        if (date.venueId) {
          // Get venue coordinates
          const venueResult = await db.select().from(venues).where(eq(venues.id, date.venueId));
          
          if (venueResult.length > 0) {
            const venue = venueResult[0];
            const lat = parseFloat(venue.latitude);
            const lng = parseFloat(venue.longitude);
            
            if (!isNaN(lat) && !isNaN(lng)) {
              coordinates.push({ 
                lat, 
                lng, 
                city: venue.city, 
                state: venue.state,
                venueName: venue.name
              });
              
              // Calculate distance from previous location
              if (i > 0 && coordinates.length > 1) {
                // Calculate distance using the Haversine formula
                const prevCoord = coordinates[coordinates.length - 2];
                const currentCoord = coordinates[coordinates.length - 1];
                
                const distance = calculateDistance(
                  prevCoord.lat, prevCoord.lng,
                  currentCoord.lat, currentCoord.lng
                );
                
                totalDistance += distance;
                
                legs.push({
                  from: prevCoord.venueName || `${prevCoord.city}, ${prevCoord.state}`,
                  to: currentCoord.venueName || `${currentCoord.city}, ${currentCoord.state}`,
                  distance
                });
              }
            }
          }
        } else if (date.city && date.state) {
          // Use city/state as fallback if no venue ID
          coordinates.push({ 
            lat: 0, 
            lng: 0, 
            city: date.city, 
            state: date.state,
            venueName: date.venueName
          });
        }
      }
      
      res.json({
        coordinates,
        totalDistance: Math.round(totalDistance), // In miles
        legs
      });
    } catch (error) {
      console.error(`Error fetching route for tour ${req.params.id}:`, error);
      res.status(500).json({ error: "Failed to fetch route information" });
    }
  });
}

// Calculate the distance between two points using the Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Radius of the Earth in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in miles
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}