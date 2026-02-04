import express from 'express';
import multer from 'multer';
import { query } from '../db/index.js';
import storage from '../services/storage/index.js';

const router = express.Router();

// Configure multer for memory storage (we'll process and save via storage service)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow images
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WebP)'));
    }
  },
});

/**
 * POST /api/photos
 * Upload a photo and associate it with a report
 */
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { reportId } = req.body;

    // Validate reportId
    if (!reportId) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'reportId is required',
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'No file uploaded',
      });
    }

    // Verify report exists
    const reportResult = await query(
      'SELECT id FROM reports WHERE id = $1',
      [reportId]
    );

    if (reportResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not found',
        message: `Report with id ${reportId} not found`,
      });
    }

    // Upload file to storage
    const { url, publicId } = await storage.upload(req.file);

    // Save photo record to database
    const insertResult = await query(
      `INSERT INTO photos (report_id, cloudinary_url, cloudinary_public_id)
       VALUES ($1, $2, $3)
       RETURNING id, cloudinary_url as url, created_at`,
      [reportId, url, publicId]
    );

    // Update report's has_photo flag
    await query(
      'UPDATE reports SET has_photo = true WHERE id = $1',
      [reportId]
    );

    const photo = insertResult.rows[0];

    console.log(`Photo uploaded for report ${reportId}: ${publicId}`);

    res.status(201).json({
      success: true,
      photo: {
        id: photo.id,
        url: photo.url,
        reportId: parseInt(reportId),
        createdAt: photo.created_at,
      },
    });
  } catch (error) {
    console.error('Error uploading photo:', error);

    if (error.message.includes('Only image files')) {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message,
      });
    }

    res.status(500).json({
      error: 'Upload failed',
      message: 'Failed to upload photo. Please try again.',
    });
  }
});

/**
 * GET /api/photos/:reportId
 * Get all photos for a specific report
 */
router.get('/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;

    const result = await query(
      `SELECT id, cloudinary_url as url, created_at as "createdAt"
       FROM photos
       WHERE report_id = $1
       ORDER BY created_at DESC`,
      [reportId]
    );

    res.json({
      reportId: parseInt(reportId),
      photos: result.rows,
    });
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({
      error: 'Fetch failed',
      message: 'Failed to fetch photos. Please try again.',
    });
  }
});

/**
 * DELETE /api/photos/:photoId
 * Delete a specific photo
 */
router.delete('/:photoId', async (req, res) => {
  try {
    const { photoId } = req.params;

    // Get photo details first
    const photoResult = await query(
      'SELECT id, report_id, cloudinary_public_id FROM photos WHERE id = $1',
      [photoId]
    );

    if (photoResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not found',
        message: `Photo with id ${photoId} not found`,
      });
    }

    const photo = photoResult.rows[0];

    // Delete from storage
    await storage.delete(photo.cloudinary_public_id);

    // Delete from database
    await query('DELETE FROM photos WHERE id = $1', [photoId]);

    // Check if report has any remaining photos
    const remainingPhotos = await query(
      'SELECT COUNT(*) as count FROM photos WHERE report_id = $1',
      [photo.report_id]
    );

    if (parseInt(remainingPhotos.rows[0].count) === 0) {
      await query(
        'UPDATE reports SET has_photo = false WHERE id = $1',
        [photo.report_id]
      );
    }

    console.log(`Photo deleted: ${photoId}`);

    res.json({
      success: true,
      message: 'Photo deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({
      error: 'Delete failed',
      message: 'Failed to delete photo. Please try again.',
    });
  }
});

export default router;
