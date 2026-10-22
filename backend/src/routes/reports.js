import express from 'express';
import { query } from '../db/index.js';
import { reportRateLimit } from '../middleware/rateLimit.js';
import { getClientHash } from '../utils/clientHash.js';

const router = express.Router();

// Valid status values
const VALID_STATUSES = ['no_line', 'short_line', 'long_line'];

// POST /api/report - Submit a new line status report
router.post('/', reportRateLimit, async (req, res) => {
  try {
    const { status, estimatedPeople } = req.body;

    // Validate required fields
    if (!status) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Status is required',
      });
    }

    // Validate status value
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: 'Validation error',
        message: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    // Validate estimatedPeople if provided
    if (estimatedPeople !== undefined && estimatedPeople !== null) {
      const people = parseInt(estimatedPeople);
      if (isNaN(people) || people < 0) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Estimated people must be a non-negative number',
        });
      }
    }

    // Hashed, daily-rotating client identifier (raw IPs are never stored)
    const ipHash = getClientHash(req);

    console.log(`New report: ${status}`);

    // Insert the report into the database
    const result = await query(
      `INSERT INTO reports (status, estimated_people, ip_hash)
       VALUES ($1, $2, $3)
       RETURNING id, status, estimated_people, created_at`,
      [status, estimatedPeople || null, ipHash]
    );

    const newReport = result.rows[0];

    // Fetch updated status after this report
    const statusResult = await query(
      `SELECT status, estimated_people, created_at
       FROM reports
       WHERE created_at > NOW() - INTERVAL '30 minutes'
       ORDER BY created_at DESC`,
      []
    );

    const recentReports = statusResult.rows;

    // Calculate the most common status
    const statusCounts = recentReports.reduce((acc, report) => {
      acc[report.status] = (acc[report.status] || 0) + 1;
      return acc;
    }, {});

    const currentStatus = Object.entries(statusCounts).reduce((a, b) =>
      a[1] > b[1] ? a : b
    )[0];

    const confidence = Math.round((statusCounts[currentStatus] / recentReports.length) * 100);

    console.log(`Report submitted successfully. New status: ${currentStatus}`);

    res.status(201).json({
      success: true,
      report: newReport,
      currentStatus: {
        status: currentStatus,
        lastUpdated: recentReports[0].created_at,
        confidence,
        totalReports: recentReports.length,
      },
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({
      error: 'Failed to create report',
      message: error.message,
    });
  }
});

// GET /api/report - Get all recent reports (for debugging/admin)
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const result = await query(
      `SELECT id, status, estimated_people, created_at
       FROM reports
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      reports: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      error: 'Failed to fetch reports',
      message: error.message,
    });
  }
});

export default router;
