import { Express, Request, Response } from "express";

/**
 * Register configuration-related API routes
 */
export function registerConfigRoutes(app: Express): void {
  // Provide Google Maps API key to the frontend
  app.get("/api/config/maps-api-key", (_req: Request, res: Response) => {
    res.json({ apiKey: process.env.GOOGLE_MAPS_API_KEY || "" });
  });
}