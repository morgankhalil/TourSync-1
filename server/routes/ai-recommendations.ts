
import { Router } from 'express';
import { AIRecommendationService } from '../services/ai-recommendations';

const router = Router();
const aiService = new AIRecommendationService();

router.post('/api/ai/venue-recommendations', async (req, res) => {
  try {
    const { band, venues } = req.body;
    const recommendations = await aiService.getVenueRecommendations(band, venues);
    res.json({ recommendations });
  } catch (error) {
    console.error('AI recommendation error:', error);
    res.status(500).json({ error: 'Failed to get AI recommendations' });
  }
});

export default router;
