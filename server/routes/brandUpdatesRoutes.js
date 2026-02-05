import express from 'express';
import BrandUpdate from '../models/BrandUpdate.js';
import Brand from '../models/Brand.js';
import User from '../models/User.js';
import { verifyToken } from '../middleware/auth.js';
import rssFeedService from '../services/rssFeedService.js';

const router = express.Router();

// Admin middleware - you'll need to create this or adjust based on your auth setup
// For now, using a simple check - replace with your actual admin check
const adminMiddleware = (req, res, next) => {
  // Example: check if user has admin role
  // Adjust this based on your User model
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
};

// ==========================================
// USER ENDPOINTS
// ==========================================

/**
 * GET /api/updates/feed
 * Get updates from brands the user follows
 */
router.get('/feed', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user.id;

    // Get user's followed brands
    const user = await User.findById(userId).select('followedBrands');
    const followedBrandIds = user.followedBrands || [];

    if (followedBrandIds.length === 0) {
      return res.json({
        success: true,
        updates: [],
        pagination: {
          page: 1,
          limit,
          total: 0,
          pages: 0
        },
        message: 'Follow some brands to see their updates!'
      });
    }

    // Fetch updates from followed brands
    const skip = (page - 1) * limit;
    const updates = await BrandUpdate.find({
      brandId: { $in: followedBrandIds },
      isActive: true
    })
      .populate('brandId', 'name logoPath')
      .sort({ publishedDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await BrandUpdate.countDocuments({
      brandId: { $in: followedBrandIds },
      isActive: true
    });

    res.json({
      success: true,
      updates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching updates feed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch updates'
    });
  }
});

/**
 * GET /api/updates/brand/:brandId
 * Get all updates for a specific brand
 */
router.get('/brand/:brandId', verifyToken, async (req, res) => {
  try {
    const { brandId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;
    const updates = await BrandUpdate.find({
      brandId,
      isActive: true
    })
      .populate('brandId', 'name logoPath')
      .sort({ publishedDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await BrandUpdate.countDocuments({
      brandId,
      isActive: true
    });

    res.json({
      success: true,
      updates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching brand updates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch brand updates'
    });
  }
});

/**
 * POST /api/updates/:updateId/view
 * Increment view count
 */
router.post('/:updateId/view', verifyToken, async (req, res) => {
  try {
    const update = await BrandUpdate.findByIdAndUpdate(
      req.params.updateId,
      { $inc: { viewCount: 1 } },
      { new: true }
    );

    res.json({ success: true, viewCount: update.viewCount });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update view count' });
  }
});

// ==========================================
// ADMIN ENDPOINTS
// ==========================================

/**
 * POST /api/updates/admin/trigger-fetch
 * Manually trigger RSS fetch for all brands
 */
router.post('/admin/trigger-fetch', [verifyToken, adminMiddleware], async (req, res) => {
  try {
    console.log('🔄 Manual RSS fetch triggered by admin');
    
    // Run in background and return immediately
    rssFeedService.fetchAllBrandUpdates()
      .then(results => {
        console.log('✅ Manual RSS fetch completed:', results);
      })
      .catch(error => {
        console.error('❌ Manual RSS fetch failed:', error);
      });

    res.json({
      success: true,
      message: 'RSS fetch started in background'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to trigger RSS fetch'
    });
  }
});

/**
 * POST /api/updates/admin/create
 * Manually create a brand update (for brands without RSS)
 */
router.post('/admin/create', [verifyToken, adminMiddleware], async (req, res) => {
  try {
    const {
      brandId,
      title,
      description,
      imageUrl,
      sourceUrl,
      updateType,
      publishedDate
    } = req.body;

    // Validation
    if (!brandId || !title || !description || !sourceUrl) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const update = new BrandUpdate({
      brandId,
      title,
      description,
      imageUrl,
      sourceUrl,
      updateType: updateType || 'general',
      publishedDate: publishedDate || new Date(),
      source: 'manual',
      postedBy: req.user.id
    });

    await update.save();

    res.json({
      success: true,
      update
    });

  } catch (error) {
    console.error('Error creating manual update:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create update'
    });
  }
});

/**
 * DELETE /api/updates/admin/:updateId
 * Soft delete an update (set isActive to false)
 */
router.delete('/admin/:updateId', [verifyToken, adminMiddleware], async (req, res) => {
  try {
    const update = await BrandUpdate.findByIdAndUpdate(
      req.params.updateId,
      { isActive: false },
      { new: true }
    );

    res.json({ success: true, update });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete update' });
  }
});

/**
 * GET /api/updates/admin/stats
 * Get statistics about updates
 */
router.get('/admin/stats', [verifyToken, adminMiddleware], async (req, res) => {
  try {
    const totalUpdates = await BrandUpdate.countDocuments({ isActive: true });
    const updatesBySource = await BrandUpdate.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ]);
    const updatesByType = await BrandUpdate.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$updateType', count: { $sum: 1 } } }
    ]);

    // Recent updates
    const recentUpdates = await BrandUpdate.find({ isActive: true })
      .populate('brandId', 'name')
      .sort({ publishedDate: -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      stats: {
        totalUpdates,
        bySource: updatesBySource,
        byType: updatesByType,
        recentUpdates
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

export default router;