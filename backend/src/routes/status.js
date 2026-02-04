import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// GET /api/status - Get current line status based on recent reports
router.get('/', async (req, res) => {
  try {
    console.log('Fetching current status...');

    // Query reports from the last 30 minutes
    const result = await query(
      `SELECT status, estimated_people, created_at
       FROM reports
       WHERE created_at > NOW() - INTERVAL '30 minutes'
       ORDER BY created_at DESC`,
      []
    );

    const recentReports = result.rows;

    // If no recent reports, return unknown status
    if (recentReports.length === 0) {
      console.log('No recent reports found');
      return res.json({
        status: 'unknown',
        lastUpdated: null,
        recentReports: [],
        confidence: 0,
        message: 'No recent reports available',
      });
    }

    // Calculate the most common status
    const statusCounts = recentReports.reduce((acc, report) => {
      acc[report.status] = (acc[report.status] || 0) + 1;
      return acc;
    }, {});

    // Find the status with the highest count
    const currentStatus = Object.entries(statusCounts).reduce((a, b) =>
      a[1] > b[1] ? a : b
    )[0];

    // Calculate confidence based on consensus
    const confidence = Math.round((statusCounts[currentStatus] / recentReports.length) * 100);

    // Get the most recent report time
    const lastUpdated = recentReports[0].created_at;

    console.log(`Current status: ${currentStatus} (confidence: ${confidence}%)`);

    res.json({
      status: currentStatus,
      lastUpdated,
      recentReports: recentReports.slice(0, 10), // Return only last 10 for brevity
      confidence,
      totalReports: recentReports.length,
    });
  } catch (error) {
    console.error('Error fetching status:', error);
    res.status(500).json({
      error: 'Failed to fetch status',
      message: error.message,
    });
  }
});

export default router;
