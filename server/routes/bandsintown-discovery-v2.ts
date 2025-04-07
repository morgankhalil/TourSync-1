/**
 * Enhanced Bandsintown Discovery API Routes
 * This provides a more powerful version of the discovery API
 * with improved caching, routing logic, and expanded artist database
 */

import { Router, Request, Response } from 'express';
import { EnhancedBandsintownDiscoveryService } from '../services/bandsintown-discovery-enhanced';

// Create the enhanced discovery service
const BANDSINTOWN_API_KEY = process.env.BANDSINTOWN_API_KEY;
const discoveryService = new EnhancedBandsintownDiscoveryService(BANDSINTOWN_API_KEY || '');

export function registerBandsintownDiscoveryV2Routes(router: Router) {
  /**
   * GET /api/bandsintown-discovery-v2/status
   * Check the status of the Bandsintown API connection
   */
  router.get('/api/bandsintown-discovery-v2/status', async (req: Request, res: Response) => {
    try {
      const status = await discoveryService.checkStatus();
      res.json(status);
    } catch (error) {
      console.error('Error checking Bandsintown API status:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to check Bandsintown API status',
        error: error.message
      });
    }
  });

  /**
   * GET /api/bandsintown-discovery-v2/discover
   * Find bands passing near a venue (main discovery endpoint)
   */
  router.get('/api/bandsintown-discovery-v2/discover', async (req: Request, res: Response) => {
    try {
      const {
        venueId,
        startDate,
        endDate,
        radius,
        genres,
        maxBands,
        maxDistance,
        lookAheadDays
      } = req.query;

      // Validate required parameters
      if (!venueId || !startDate || !endDate) {
        return res.status(400).json({
          status: 'error',
          message: 'Missing required parameters: venueId, startDate, endDate'
        });
      }

      // Parse numeric parameters
      const numericVenueId = parseInt(venueId as string, 10);
      const numericRadius = radius ? parseInt(radius as string, 10) : 50;
      const numericMaxBands = maxBands ? parseInt(maxBands as string, 10) : 20;
      const numericMaxDistance = maxDistance ? parseInt(maxDistance as string, 10) : 200;
      const numericLookAheadDays = lookAheadDays ? parseInt(lookAheadDays as string, 10) : 90;

      // Parse genre array
      const genresArray = genres ? (genres as string).split(',') : [];

      // Set up progress reporting
      let lastReportedProgress = 0;
      const onProgress = (completed: number, total: number) => {
        const progressPercent = Math.floor((completed / total) * 100);
        if (progressPercent > lastReportedProgress + 10) {
          lastReportedProgress = progressPercent;
          console.log(`Discovery progress: ${progressPercent}% (${completed}/${total})`);
        }
      };

      // Set appropriate headers for streaming
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Transfer-Encoding', 'chunked');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      // Create a flag to track if any incremental results were sent
      let incrementalResultsSent = false;
      
      try {
        // Find bands near venue with streaming incremental results
        const result = await discoveryService.findBandsNearVenue({
          venueId: numericVenueId,
          startDate: startDate as string,
          endDate: endDate as string,
          radius: numericRadius,
          genres: genresArray,
          maxBands: numericMaxBands,
          maxDistance: numericMaxDistance,
          lookAheadDays: numericLookAheadDays,
          onProgress,
          onIncrementalResults: (newResults) => {
            if (newResults && newResults.length > 0) {
              try {
                // Send each batch as a newline-delimited JSON
                res.write(JSON.stringify({results: newResults, status: "in-progress"}) + '\n');
                incrementalResultsSent = true;
              } catch (err) {
                console.error('Error sending incremental results:', err);
              }
            }
          }
        });

        console.log(`Discovery complete. Found ${result.data.length} bands near venue ${numericVenueId}`);

        // If we sent incremental results, end the response
        if (incrementalResultsSent) {
          try {
            // Send the final complete result
            res.write(JSON.stringify({results: result.data, status: "complete"}) + '\n');
            res.end();
          } catch (err) {
            console.error('Error sending final streaming response:', err);
            // Try to send a regular response if streaming failed
            if (!res.headersSent) {
              res.json(result);
            }
          }
        } else {
          // If no incremental results were sent, just send the final result as normal JSON
          res.json(result);
        }
      } catch (innerError) {
        console.error('Error during band discovery process:', innerError);
        
        // If we already started streaming, try to end the response with an error
        if (incrementalResultsSent) {
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
        error: error.message
      });
    }
  });

  /**
   * POST /api/bandsintown-discovery-v2/clear-cache
   * Clear the API cache
   */
  router.post('/api/bandsintown-discovery-v2/clear-cache', (req: Request, res: Response) => {
    try {
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
        error: error.message
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