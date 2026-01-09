import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to read brands from JSON file
const getBrandsFromFile = () => {
  const filePath = path.join(__dirname, '../data/FashionBrands.json');
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
};

/* GET - Get All Brands (from JSON) */
export const getAllBrands = (req, res) => {
  try {
    const brands = getBrandsFromFile();
    
    res.status(200).json({
      success: true,
      brands
    });
  } catch (error) {
    console.error('Error getting brands:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* GET - Get Brand by ID (from JSON) */
export const getBrand = (req, res) => {
  try {
    const { id } = req.params;
    const brands = getBrandsFromFile();
    const brand = brands.find(b => b._id === id);
    
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found"
      });
    }
    
    res.status(200).json({
      success: true,
      brand
    });
  } catch (error) {
    console.error('Error getting brand:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* GET - Search Brands (from JSON) */
export const searchBrands = (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required"
      });
    }
    
    const brands = getBrandsFromFile();
    const searchResults = brands.filter(brand =>
      brand.name.toLowerCase().includes(query.toLowerCase()) ||
      brand.about.toLowerCase().includes(query.toLowerCase())
    );
    
    res.status(200).json({
      success: true,
      brands: searchResults
    });
  } catch (error) {
    console.error('Error searching brands:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* POST - Follow/Unfollow Brand (works with JSON brands) */
export const followBrand = async (req, res) => {
  try {
    const { userId } = req.params;
    const { brandId } = req.body;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Check if brand exists in JSON
    const brands = getBrandsFromFile();
    const brand = brands.find(b => b._id === brandId);
    
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found"
      });
    }
    
    // Check if user already follows this brand
    const isFollowing = user.followedBrands.some(
      id => id.toString() === brandId
    );
    
    if (isFollowing) {
      // Unfollow
      user.followedBrands = user.followedBrands.filter(
        id => id.toString() !== brandId
      );
    } else {
      // Follow
      user.followedBrands.push(brandId);
    }
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: isFollowing ? "Brand unfollowed" : "Brand followed",
      followedBrands: user.followedBrands
    });
  } catch (error) {
    console.error('Error following brand:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* GET - Get User's Followed Brands (from JSON) */
export const getUserFollowedBrands = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Get all brands from JSON
    const allBrands = getBrandsFromFile();
    
    // Filter to only the brands the user follows
    const followedBrands = allBrands.filter(brand =>
      user.followedBrands.some(id => id.toString() === brand._id)
    );
    
    res.status(200).json({
      success: true,
      brands: followedBrands
    });
  } catch (error) {
    console.error('Error getting followed brands:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};