/**
 * Unified Bandsintown Discovery API Routes
 * This combines the best features from both v1 and v2 discovery APIs
 * with improved caching, streaming support, and better organization.
 */

import { Router, Request, Response } from 'express';
import { EnhancedBandsintownDiscoveryService } from '../services/bandsintown-discovery-enhanced';
import { fromZodError } from 'zod-validation-error';
import { z } from 'zod';

// Create the enhanced discovery service with proper API key handling
const BANDSINTOWN_API_KEY = process.env.BANDSINTOWN_API_KEY;
const discoveryService = new EnhancedBandsintownDiscoveryService(BANDSINTOWN_API_KEY || '');

// Helper to set up streaming response
const setupStreamingResponse = (res: Response) => {
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
};

// Comprehensive validation schema for discovery requests
const discoverRequestSchema = z.object({
  venueId: z.number().int().positive(),
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "Start date must be a valid date string"
  }),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), {
    message: "End date must be a valid date string"
  }),
  radius: z.number().optional().default(50),
  genres: z.array(z.string()).optional(),
  maxBands: z.number().optional().default(20),
  maxDistance: z.number().optional(),
  lookAheadDays: z.number().optional().default(90),
  streaming: z.boolean().optional().default(false),
  useDemoMode: z.boolean().optional().default(false)
});

export function registerBandsintownDiscoveryRoutes(router: Router) {
  /**
   * GET /api/bandsintown-discovery/discover
   * Main discovery endpoint with streaming support
   */
  router.get('/api/bandsintown-discovery/discover', async (req: Request, res: Response) => {
    try {
      // Parse and validate request parameters
      const validation = discoverRequestSchema.safeParse({
        ...req.query,
        venueId: parseInt(req.query.venueId as string, 10),
        radius: req.query.radius ? parseInt(req.query.radius as string, 10) : undefined,
        maxBands: req.query.maxBands ? parseInt(req.query.maxBands as string, 10) : undefined,
        maxDistance: req.query.maxDistance ? parseInt(req.query.maxDistance as string, 10) : undefined,
        lookAheadDays: req.query.lookAheadDays ? parseInt(req.query.lookAheadDays as string, 10) : undefined,
        streaming: req.query.streaming === 'true',
        useDemoMode: req.query.useDemoMode === 'true'
      });

      if (!validation.success) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid request parameters',
          errors: fromZodError(validation.error)
        });
      }

      const {
        venueId,
        startDate,
        endDate,
        radius,
        genres,
        maxBands,
        maxDistance,
        lookAheadDays,
        streaming,
        useDemoMode
      } = validation.data;

      // Set up streaming if requested
      if (streaming) {
        setupStreamingResponse(res);
      }

      // Set up progress tracking
      let lastProgress = 0;
      const onProgress = (completed: number, total: number) => {
        const progress = Math.floor((completed / total) * 100);
        if (progress > lastProgress + 10) {
          lastProgress = progress;
          console.log(`Discovery progress: ${progress}% (${completed}/${total})`);
        }
      };

      // Track if any incremental results were sent
      let incrementalResultsSent = false;

      // Run the discovery
      try {
        const result = await discoveryService.findBandsNearVenue({
          venueId,
          startDate,
          endDate,
          radius,
          genres,
          maxBands,
          maxDistance,
          lookAheadDays,
          useDemo: useDemoMode,
          onProgress,
          onIncrementalResults: streaming ? (newResults) => {
            if (newResults && newResults.length > 0) {
              try {
                res.write(JSON.stringify({
                  status: 'in-progress',
                  results: newResults
                }) + '\n');
                incrementalResultsSent = true;
              } catch (err) {
                console.error('Error sending incremental results:', err);
              }
            }
          } : undefined
        });

        // Send final response
        if (streaming && incrementalResultsSent) {
          res.write(JSON.stringify({
            status: 'complete',
            results: result.data,
            stats: result.stats,
            venue: result.venue
          }) + '\n');
          res.end();
        } else {
          res.json(result);
        }
      } catch (error) {
        console.error('Error during discovery process:', error);
        if (streaming && incrementalResultsSent) {
          res.write(JSON.stringify({
            status: 'error',
            message: 'Discovery process failed'
          }) + '\n');
          res.end();
        } else if (!res.headersSent) {
          res.status(500).json({
            status: 'error',
            message: 'Discovery process failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    } catch (error) {
      console.error('Error in discovery endpoint:', error);
      if (!res.headersSent) {
        res.status(500).json({
          status: 'error',
          message: 'Failed to process discovery request',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  });

  /**
   * GET /api/bandsintown-discovery/status
   * Check the status of the Bandsintown API connection
   */
  router.get('/api/bandsintown-discovery/status', async (_req: Request, res: Response) => {
    try {
      const status = await discoveryService.checkStatus();
      res.json(status);
    } catch (error) {
      console.error('Error checking Bandsintown API status:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to check Bandsintown API status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * POST /api/bandsintown-discovery/clear-cache
   * Clear the API request cache
   */
  router.post('/api/bandsintown-discovery/clear-cache', (_req: Request, res: Response) => {
    try {
      console.log('Clearing discovery service cache...');
      discoveryService.clearCache();
      res.json({
        status: 'success',
        message: 'Cache cleared successfully'
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to clear cache',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/bandsintown-discovery/demo-data
   * Get demo discovery data for testing or when API key is not configured
   */
  router.get('/api/bandsintown-discovery/demo-data', async (req: Request, res: Response) => {
    try {
      const { venueId } = req.query;

      if (!venueId) {
        return res.status(400).json({
          status: 'error',
          message: 'Missing venueId parameter'
        });
      }

      const numericVenueId = parseInt(venueId as string, 10);
      const now = new Date();
      const twoMonthsLater = new Date();
      twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);

      const result = await discoveryService.findBandsNearVenue({
        venueId: numericVenueId,
        startDate: now.toISOString().split('T')[0],
        endDate: twoMonthsLater.toISOString().split('T')[0],
        radius: 100,
        maxBands: 10,
        useDemo: true
      });

      res.json(result);
    } catch (error) {
      console.error('Error getting demo data:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to get demo data',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}