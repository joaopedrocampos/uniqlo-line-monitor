import express from 'express';
import { getHistoryAnalysis } from '../services/historyService.js';

const router = express.Router();

/**
 * GET /api/history
 * Get historical patterns for line status
 *
 * Query params:
 *   - days: Number of days to analyze (default: 7, max: 30)
 */
router.get('/', async (req, res) => {
  try {
    let days = parseInt(req.query.days) || 7;

    // Validate days parameter
    if (days < 1) days = 1;
    if (days > 30) days = 30;

    const analysis = await getHistoryAnalysis(days);

    res.json(analysis);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({
      error: 'Fetch failed',
      message: 'Failed to fetch historical data. Please try again.',
    });
  }
});

export default router;
