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
   * GET /api/bandsintown-discovery-v2/near-venue
   * Find bands passing near a venue
   */
  router.get('/api/bandsintown-discovery-v2/near-venue', async (req: Request, res: Response) => {
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
      
      // Find bands near venue
      const result = await discoveryService.findBandsNearVenue({
        venueId: numericVenueId,
        startDate: startDate as string,
        endDate: endDate as string,
        radius: numericRadius,
        genres: genresArray,
        maxBands: numericMaxBands,
        maxDistance: numericMaxDistance,
        lookAheadDays: numericLookAheadDays,
        onProgress
      });
      
      res.json(result);
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
}