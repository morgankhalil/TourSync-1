import { Express, Request, Response } from 'express';
import { z } from 'zod';
import { BandsintownIntegration, createBandsintownIntegration } from '../integrations/bandsintown';
import { addDays } from 'date-fns';

// Schema for validating import artist request
const importArtistSchema = z.object({
  artistName: z.string().min(1, "Artist name is required")
});

// Schema for validating batch import request
const batchImportSchema = z.object({
  artistNames: z.array(z.string()).min(1, "At least one artist name is required")
});

// Schema for extracting venues request
const extractVenuesSchema = z.object({
  artistNames: z.array(z.string()).min(1, "At least one artist name is required")
});

// Schema for finding bands near venue
const findBandsNearVenueSchema = z.object({
  venueId: z.number().int().positive("Valid venue ID is required"),
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), "Valid start date is required"),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), "Valid end date is required"),
  radius: z.number().positive("Radius must be a positive number")
});

// Schema for refreshing tour routes
const refreshTourRoutesSchema = z.object({
  daysAhead: z.number().int().positive().optional(),
  minArtistCount: z.number().int().positive().optional()
});

let bandsintownIntegration: BandsintownIntegration | null = null;

// Helper to get the integration
function getIntegration(): BandsintownIntegration {
  if (!bandsintownIntegration) {
    // Check for API key in environment variables
    const apiKey = process.env.BANDSINTOWN_API_KEY;
    if (!apiKey) {
      throw new Error('BANDSINTOWN_API_KEY environment variable is not set');
    }
    bandsintownIntegration = createBandsintownIntegration(apiKey);
  }
  return bandsintownIntegration;
}

export function registerBandsintownRoutes(app: Express): void {
  // Get artist information
  app.get('/api/bandsintown/artist/:name', async (req: Request, res: Response) => {
    try {
      const artistName = req.params.name;
      
      if (!artistName) {
        return res.status(400).json({ error: 'Artist name is required' });
      }
      
      const integration = getIntegration();
      const artist = await integration.getArtist(artistName);
      
      if (!artist) {
        return res.status(404).json({ error: 'Artist not found' });
      }
      
      res.json(artist);
    } catch (error) {
      console.error('Error getting artist:', error);
      res.status(500).json({ error: 'Failed to get artist information' });
    }
  });
  
  // Get artist events
  app.get('/api/bandsintown/artist/:name/events', async (req: Request, res: Response) => {
    try {
      const artistName = req.params.name;
      
      if (!artistName) {
        return res.status(400).json({ error: 'Artist name is required' });
      }
      
      const forceRefresh = req.query.refresh === 'true';
      
      const integration = getIntegration();
      const events = await integration.getArtistEvents(artistName, forceRefresh);
      
      res.json(events);
    } catch (error) {
      console.error('Error getting artist events:', error);
      res.status(500).json({ error: 'Failed to get artist events' });
    }
  });
  
  // Import an artist
  app.post('/api/bandsintown/import/artist', async (req: Request, res: Response) => {
    try {
      const validationResult = importArtistSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid request body',
          details: validationResult.error.format()
        });
      }
      
      const { artistName } = validationResult.data;
      const integration = getIntegration();
      
      const result = await integration.importArtistWithTourData(artistName);
      
      if (!result.band) {
        return res.status(404).json({ error: `Artist '${artistName}' not found or could not be imported` });
      }
      
      res.json({
        message: `Successfully imported artist '${artistName}'`,
        data: result
      });
    } catch (error) {
      console.error('Error importing artist:', error);
      res.status(500).json({ error: 'Failed to import artist' });
    }
  });
  
  // Batch import artists
  app.post('/api/bandsintown/import/batch', async (req: Request, res: Response) => {
    try {
      const validationResult = batchImportSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid request body',
          details: validationResult.error.format()
        });
      }
      
      const { artistNames } = validationResult.data;
      const integration = getIntegration();
      
      const results = await integration.batchImportArtists(artistNames);
      
      const successCount = results.filter(r => r.success).length;
      
      res.json({
        message: `Successfully imported ${successCount} out of ${artistNames.length} artists`,
        data: results
      });
    } catch (error) {
      console.error('Error batch importing artists:', error);
      res.status(500).json({ error: 'Failed to batch import artists' });
    }
  });
  
  // Extract venues from artist events
  app.post('/api/bandsintown/extract-venues', async (req: Request, res: Response) => {
    try {
      const validationResult = extractVenuesSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid request body',
          details: validationResult.error.format()
        });
      }
      
      const { artistNames } = validationResult.data;
      const integration = getIntegration();
      
      const venues = await integration.extractVenuesFromEvents(artistNames);
      
      res.json({
        message: `Successfully extracted ${venues.length} unique venues from ${artistNames.length} artists`,
        data: venues
      });
    } catch (error) {
      console.error('Error extracting venues:', error);
      res.status(500).json({ error: 'Failed to extract venues' });
    }
  });
  
  // Import venues from artist events
  app.post('/api/bandsintown/import-venues', async (req: Request, res: Response) => {
    try {
      const validationResult = extractVenuesSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid request body',
          details: validationResult.error.format()
        });
      }
      
      const { artistNames } = validationResult.data;
      const integration = getIntegration();
      
      const venues = await integration.importExtractedVenues(artistNames);
      
      res.json({
        message: `Successfully imported ${venues.length} unique venues from ${artistNames.length} artists`,
        data: venues
      });
    } catch (error) {
      console.error('Error importing venues:', error);
      res.status(500).json({ error: 'Failed to import venues' });
    }
  });
  
  // NEW ENDPOINTS FOR ENHANCED ARTIST DISCOVERY
  
  /**
   * Find bands near a venue within a date range
   * This endpoint is the heart of the intelligent routing discovery feature
   */
  app.post('/api/bandsintown/find-bands-near-venue', async (req: Request, res: Response) => {
    try {
      const validationResult = findBandsNearVenueSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid request body',
          details: validationResult.error.format()
        });
      }
      
      const { venueId, startDate, endDate, radius } = validationResult.data;
      const integration = getIntegration();
      
      const results = await integration.findBandsNearVenue(
        venueId,
        new Date(startDate),
        new Date(endDate),
        radius
      );
      
      res.json({
        message: `Found ${results.length} bands touring near your venue in the specified date range`,
        data: results
      });
    } catch (error) {
      console.error('Error finding bands near venue:', error);
      res.status(500).json({ error: 'Failed to find bands near venue' });
    }
  });
  
  /**
   * Refresh upcoming tour routes
   * Refreshes the database with the latest tour information for a specified period
   */
  app.post('/api/bandsintown/refresh-tour-routes', async (req: Request, res: Response) => {
    try {
      const validationResult = refreshTourRoutesSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid request body',
          details: validationResult.error.format()
        });
      }
      
      const { daysAhead = 180, minArtistCount = 50 } = validationResult.data;
      const integration = getIntegration();
      
      const results = await integration.refreshUpcomingTourRoutes(
        new Date(), // today
        addDays(new Date(), daysAhead),
        minArtistCount
      );
      
      res.json({
        message: `Refreshed tour routes for ${results.processed} artists (${results.updated} updated, ${results.failed} failed)`,
        data: results
      });
    } catch (error) {
      console.error('Error refreshing tour routes:', error);
      res.status(500).json({ error: 'Failed to refresh tour routes' });
    }
  });
  
  /**
   * Get the health status of the Bandsintown integration
   * Shows cache statistics and current monitoring status
   */
  app.get('/api/bandsintown/status', async (_req: Request, res: Response) => {
    try {
      const integration = getIntegration() as any; // Using any to access private properties
      
      // Get some stats (implementation depends on your actual class structure)
      const cacheStats = {
        cachedArtists: integration.artistCache?.keys().length ?? 0,
        monitoredArtists: integration.websocketClients?.size ?? 0,
        priorityArtists: integration.priorityArtists?.size ?? 0,
        activePolling: integration.pollingIntervals?.size ?? 0
      };
      
      res.json({
        status: 'healthy',
        apiKeyConfigured: !!process.env.BANDSINTOWN_API_KEY,
        stats: cacheStats,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error getting Bandsintown status:', error);
      res.status(500).json({ error: 'Failed to get status' });
    }
  });
}