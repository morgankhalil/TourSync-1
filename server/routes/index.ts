import { Express } from 'express';
import { createServer } from 'http';
import venueRoutes from './venue-routes';
import { Router } from 'express';

// Create empty routers for imported routes when we need them
const emptyRouter = Router();

export const registerRoutes = (app: Express) => {
  // Register API routes - only venues are fully implemented for now
  app.use('/api/venues', venueRoutes);
  
  // Create HTTP server
  const server = createServer(app);
  
  return server;
};