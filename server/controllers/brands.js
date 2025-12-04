import Brand from "../models/Brand.js";
import Release from "../models/Release.js";

/* CREATE - Create Brand */
export const createBrand = async (req, res) => {
  try {
    const {
      name,
      description,
      logoPath,
      websiteUrl,
      socialMedia,
      category
    } = req.body;

    // Check if brand already exists
    const existingBrand = await Brand.findOne({ name });
    
    if (existingBrand) {
      return res.status(400).json({ 
        success: false,
        message: "Brand with this name already exists" 
      });
    }

    const newBrand = new Brand({
      name,
      description,
      logoPath,
      websiteUrl,
      socialMedia: socialMedia || {},
      category: category || 'Other',
      followers: [],
      isVerified: false,
      lastUpdated: new Date()
    });

    await newBrand.save();

    res.status(201).json({
      success: true,
      message: "Brand created successfully",
      brand: newBrand
    });
  } catch (err) {
    console.error('Create brand error:', err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/* READ - Get All Brands */
export const getAllBrands = async (req, res) => {
  try {
    const { page = 1, limit = 20, category } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    
    // Filter by category if provided
    if (category) {
      query.category = category;
    }

    const brands = await Brand.find(query)
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Brand.countDocuments(query);

    res.status(200).json({
      success: true,
      brands,
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

/* READ - Get Brand by ID */
export const getBrand = async (req, res) => {
  try {
    const { id } = req.params;
    
    const brand = await Brand.findById(id);

    if (!brand) {
      return res.status(404).json({ 
        success: false,
        message: "Brand not found" 
      });
    }

    // Get recent releases for this brand
    const recentReleases = await Release.find({ brandId: id })
      .sort({ releaseDate: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      brand,
      recentReleases
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/* READ - Get Popular Brands */
export const getPopularBrands = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get brands sorted by follower count
    const brands = await Brand.aggregate([
      {
        $addFields: {
          followerCount: { $size: "$followers" }
        }
      },
      {
        $sort: { followerCount: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    res.status(200).json({
      success: true,
      brands
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/* UPDATE - Update Brand */
export const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Don't allow updating followers directly
    delete updates.followers;
    
    updates.lastUpdated = new Date();

    const updatedBrand = await Brand.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedBrand) {
      return res.status(404).json({ 
        success: false,
        message: "Brand not found" 
      });
    }

    res.status(200).json({
      success: true,
      message: "Brand updated successfully",
      brand: updatedBrand
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/* DELETE - Delete Brand */
export const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;

    const brand = await Brand.findByIdAndDelete(id);

    if (!brand) {
      return res.status(404).json({ 
        success: false,
        message: "Brand not found" 
      });
    }

    // Also delete all releases for this brand
    await Release.deleteMany({ brandId: id });

    res.status(200).json({
      success: true,
      message: "Brand and associated releases deleted successfully"
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/* SEARCH - Search Brands */
export const searchBrands = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ 
        success: false,
        message: "Search query is required" 
      });
    }

    const brands = await Brand.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    }).limit(20);

    res.status(200).json({
      success: true,
      brands
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};