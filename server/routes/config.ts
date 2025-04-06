
import { Express, Request, Response } from "express";

export function registerConfigRoutes(app: Express): void {
  app.get("/api/config/maps-api-key", (_req: Request, res: Response) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ 
        error: "Maps API key not configured",
        message: "Google Maps API key is not properly configured" 
      });
    }
    res.json({ apiKey: apiKey });
  });
}
