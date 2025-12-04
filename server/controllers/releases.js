import Release from "../models/Release.js";
import Brand from "../models/Brand.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

/* CREATE - Create Release */
export const createRelease = async (req, res) => {
  try {
    const {
      brandId,
      name,
      description,
      images,
      price,
      currency,
      releaseDate,
      purchaseUrl,
      category,
      isLimited,
      stockStatus
    } = req.body;

    // Verify brand exists
    const brand = await Brand.findById(brandId);
    if (!brand) {
      return res.status(404).json({ 
        success: false,
        message: "Brand not found" 
      });
    }

    const newRelease = new Release({
      brandId,
      name,
      description,
      images: images || [],
      price,
      currency: currency || 'USD',
      releaseDate,
      purchaseUrl,
      category: category || 'Other',
      isLimited: isLimited || false,
      stockStatus: stockStatus || 'Coming Soon',
      savedBy: [],
      views: 0,
      lastUpdated: new Date(),
      notificationSent: false
    });

    await newRelease.save();

    // Populate brand details
    const populatedRelease = await Release.findById(newRelease._id)
      .populate('brandId', 'name logoPath category');

    res.status(201).json({
      success: true,
      message: "Release created successfully",
      release: populatedRelease
    });
  } catch (err) {
    console.error('Create release error:', err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/* READ - Get All Releases (Feed) */
export const getFeedReleases = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    
    // Filter by stock status if provided
    if (status) {
      query.stockStatus = status;
    }

    const releases = await Release.find(query)
      .sort({ releaseDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('brandId', 'name logoPath category isVerified');

    const total = await Release.countDocuments(query);

    res.status(200).json({
      success: true,
      releases,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/* READ - Get Upcoming Releases */
export const getUpcomingReleases = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const now = new Date();

    const releases = await Release.find({
      releaseDate: { $gt: now },
      stockStatus: { $in: ['Coming Soon', 'Available'] }
    })
      .sort({ releaseDate: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('brandId', 'name logoPath category isVerified');

    const total = await Release.countDocuments({
      releaseDate: { $gt: now },
      stockStatus: { $in: ['Coming Soon', 'Available'] }
    });

    res.status(200).json({
      success: true,
      releases,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/* READ - Get Release by ID */
export const getRelease = async (req, res) => {
  try {
    const { id } = req.params;
    
    const release = await Release.findById(id)
      .populate('brandId', 'name logoPath category websiteUrl socialMedia isVerified');

    if (!release) {
      return res.status(404).json({ 
        success: false,
        message: "Release not found" 
      });
    }

    // Increment view count
    release.views += 1;
    await release.save();

    res.status(200).json({
      success: true,
      release
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/* READ - Get Releases by Brand */
export const getBrandReleases = async (req, res) => {
  try {
    const { brandId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const releases = await Release.find({ brandId })
      .sort({ releaseDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Release.countDocuments({ brandId });

    res.status(200).json({
      success: true,
      releases,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/* READ - Get User's Followed Brands Releases */
export const getFollowedBrandsReleases = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    const releases = await Release.find({
      brandId: { $in: user.followedBrands }
    })
      .sort({ releaseDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('brandId', 'name logoPath category');

    const total = await Release.countDocuments({
      brandId: { $in: user.followedBrands }
    });

    res.status(200).json({
      success: true,
      releases,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/* UPDATE - Save/Unsave Release */
export const saveRelease = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const release = await Release.findById(id);
    
    if (!release) {
      return res.status(404).json({ 
        success: false,
        message: "Release not found" 
      });
    }

    const isSaved = release.savedBy.some(
      (uid) => uid.toString() === userId
    );

    if (isSaved) {
      // Unsave
      release.savedBy = release.savedBy.filter(
        (uid) => uid.toString() !== userId
      );
    } else {
      // Save
      release.savedBy.push(userId);
    }

    await release.save();

    res.status(200).json({
      success: true,
      message: isSaved ? "Release unsaved" : "Release saved",
      release
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/* UPDATE - Update Release */
export const updateRelease = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    updates.lastUpdated = new Date();

    const updatedRelease = await Release.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('brandId', 'name logoPath category');

    if (!updatedRelease) {
      return res.status(404).json({ 
        success: false,
        message: "Release not found" 
      });
    }

    res.status(200).json({
      success: true,
      message: "Release updated successfully",
      release: updatedRelease
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/* DELETE - Delete Release */
export const deleteRelease = async (req, res) => {
  try {
    const { id } = req.params;

    const release = await Release.findByIdAndDelete(id);

    if (!release) {
      return res.status(404).json({ 
        success: false,
        message: "Release not found" 
      });
    }

    res.status(200).json({
      success: true,
      message: "Release deleted successfully"
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/* SEARCH - Search Releases */
export const searchReleases = async (req, res) => {
  try {
    const { query, category } = req.query;

    if (!query) {
      return res.status(400).json({ 
        success: false,
        message: "Search query is required" 
      });
    }

    let searchQuery = {
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    };

    // Add category filter if provided
    if (category) {
      searchQuery.category = category;
    }

    const releases = await Release.find(searchQuery)
      .limit(20)
      .populate('brandId', 'name logoPath category');

    res.status(200).json({
      success: true,
      releases
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};