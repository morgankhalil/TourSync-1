
/**
 * Enhanced Bandsintown Discovery API Routes
 * This provides a more powerful version of the discovery API
 * with improved caching, routing logic, and expanded artist database
 */

import { Router, Request, Response } from 'express';
import { EnhancedBandsintownDiscoveryService } from '../services/bandsintown-discovery-enhanced';
import { fromZodError } from 'zod-validation-error';
import { z } from 'zod';

// Create the enhanced discovery service
const BANDSINTOWN_API_KEY = process.env.BANDSINTOWN_API_KEY;
const discoveryService = new EnhancedBandsintownDiscoveryService(BANDSINTOWN_API_KEY || '');

// Helper to set up streaming response
const setupStreamingResponse = (res: Response) => {
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
};

// Validation schema for discovery request
const discoverRequestSchema = z.object({
  venueId: z.number().int().positive(),
  startDate: z.string().refine(val => !isNaN(Date.parse(val))),
  endDate: z.string().refine(val => !isNaN(Date.parse(val))),
  radius: z.number().optional(),
  genres: z.array(z.string()).optional(),
  maxBands: z.number().optional(),
  maxDistance: z.number().optional(),
  lookAheadDays: z.number().optional(),
  streaming: z.boolean().optional()
});

export function registerBandsintownDiscoveryV2Routes(router: Router) {
  /**
   * GET /api/bandsintown-discovery-v2/discover
   * Enhanced discovery endpoint with streaming support
   * Note: This endpoint is implemented further down with more robust code
   */

  /**
   * GET /api/bandsintown-discovery-v2/status
   * Check the status of the Bandsintown API connection
   */
  router.get('/api/bandsintown-discovery-v2/status', async (_req: Request, res: Response) => {
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
   * POST /api/bandsintown-discovery-v2/clear-cache
   * Clear the API request cache - useful when changing venues or search parameters
   */
  router.post('/api/bandsintown-discovery-v2/clear-cache', (_req: Request, res: Response) => {
    try {
      console.log('Clearing Bandsintown API cache...');
      discoveryService.clearCache();
      
      // Ensure we set correct content type
      res.setHeader('Content-Type', 'application/json');
      
      res.json({
        status: 'success',
        message: 'API cache cleared successfully'
      });
    } catch (error) {
      console.error('Error clearing API cache:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to clear API cache',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/bandsintown-discovery-v2/discover
   * Find bands passing near a venue (main discovery endpoint)
   */
  router.get('/api/bandsintown-discovery-v2/discover', async (req: Request, res: Response) => {
    try {
      const validation = discoverRequestSchema.safeParse(req.query);

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
        radius = 50,
        genres = [],
        maxBands = 20,
        maxDistance = 200,
        lookAheadDays = 90,
        streaming = false
      } = validation.data;

      // Set up progress reporting
      let lastReportedProgress = 0;
      const onProgress = (completed: number, total: number) => {
        const progressPercent = Math.floor((completed / total) * 100);
        if (progressPercent > lastReportedProgress + 10) {
          lastReportedProgress = progressPercent;
          console.log(`Discovery progress: ${progressPercent}% (${completed}/${total})`);
        }
      };

      // Set appropriate headers for streaming if requested
      if (streaming) {
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Transfer-Encoding', 'chunked');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
      }

      // Create a flag to track if any incremental results were sent
      let incrementalResultsSent = false;

      try {
        // Find bands near venue with streaming incremental results
        const result = await discoveryService.findBandsNearVenue({
          venueId,
          startDate,
          endDate,
          radius,
          genres,
          maxBands,
          maxDistance,
          lookAheadDays,
          onProgress,
          onIncrementalResults: (newResults) => {
            if (streaming && newResults && newResults.length > 0) {
              try {
                // Send each batch as a newline-delimited JSON
                res.write(JSON.stringify({
                  results: newResults,
                  status: "in-progress",
                  venue: { id: venueId }
                }) + '\n');
                incrementalResultsSent = true;
              } catch (err) {
                console.error('Error sending incremental results:', err);
              }
            }
          }
        });

        console.log(`Discovery complete. Found ${result.data.length} bands near venue ${venueId}`);

        // If we sent incremental results, end the response
        if (streaming && incrementalResultsSent) {
          try {
            // Send the final complete result with stats and venue
            res.write(JSON.stringify({
              results: result.data,
              status: "complete",
              stats: result.stats,
              venue: result.venue
            }) + '\n');
            res.end();
          } catch (err) {
            console.error('Error sending final streaming response:', err);
            // Try to send a regular response if streaming failed
            if (!res.headersSent) {
              res.json(result);
            }
          }
        } else {
          // If no incremental results were sent or not using streaming, just send the final result as normal JSON
          res.json(result);
        }
      } catch (innerError) {
        console.error('Error during band discovery process:', innerError);

        // If we already started streaming, try to end the response with an error
        if (streaming && incrementalResultsSent) {
          try {
            res.write(JSON.stringify({
              status: "error",
              message: "An error occurred during discovery"
            }) + '\n');
            res.end();
          } catch (err) {
            console.error('Error sending streaming error response:', err);
          }
        } else if (!res.headersSent) {
          // Otherwise send a normal error response
          res.status(500).json({
            status: 'error',
            message: 'Failed to complete band discovery',
            error: innerError instanceof Error ? innerError.message : 'Unknown error'
          });
        }
      }
    } catch (error) {
      console.error('Error finding bands near venue:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to find bands near venue',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/bandsintown-discovery-v2/demo-data
   * Get demo discovery data for testing
   */
  router.get('/api/bandsintown-discovery-v2/demo-data', async (req: Request, res: Response) => {
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
