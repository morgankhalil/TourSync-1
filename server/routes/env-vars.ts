import type { Express } from "express";

export function registerEnvVarsRoutes(app: Express): void {
  // Route to provide environment variables to the frontend
  app.get("/api/env", (_req, res) => {
    // Only expose specific environment variables that are needed on the frontend
    // and that are safe to expose
    const envVars = {
      GOOGLE_MAPS_API_KEY: process.env.VITE_GOOGLE_MAPS_API_KEY || "",
      BANDSINTOWN_API_KEY: process.env.VITE_BANDSINTOWN_API_KEY || "",
    };
    
    res.json(envVars);
  });
}