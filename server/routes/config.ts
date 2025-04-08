import { Express, Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();

export function registerConfigRoutes(app: Express): void {
  // Get Google Maps API key
  app.get("/api/config/maps-api-key", (_req: Request, res: Response) => {
    try {
      const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
      
      if (!googleMapsApiKey) {
        return res.status(404).json({ 
          error: "Google Maps API key not found",
          message: "Please set the GOOGLE_MAPS_API_KEY environment variable"
        });
      }
      
      res.json({ apiKey: googleMapsApiKey });
    } catch (error) {
      console.error("Error fetching Google Maps API key:", error);
      res.status(500).json({ error: "Failed to fetch Google Maps API key" });
    }
  });
}