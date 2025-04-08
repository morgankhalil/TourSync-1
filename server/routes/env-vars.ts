import { Router } from 'express';

const router = Router();

// Basic non-sensitive environment information endpoint for testing connectivity
router.get('/', (req, res) => {
  res.json({
    serverTime: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    apiStatus: 'healthy',
    endpoints: ['/api/venues', '/api/artists', '/api/events']
  });
});

export default router;