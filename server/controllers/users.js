import User from "../models/User.js";
import Brand from "../models/Brand.js";
import mongoose from "mongoose";

/* READ - Get User */
export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id)
      .select('-password')
      .populate('followedBrands', 'name logoPath')
      .populate('followers', 'userName name picturePath')
      .populate('following', 'userName name picturePath');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/* READ - Get User's Followers */
export const getUserFollowers = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).populate(
      'followers', 
      'userName name bio city picturePath'
    );

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    res.status(200).json({
      success: true,
      followers: user.followers
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/* READ - Get User's Following */
export const getUserFollowing = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).populate(
      'following', 
      'userName name bio city picturePath'
    );

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    res.status(200).json({
      success: true,
      following: user.following
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/* READ - Get User's Followed Brands */
export const getUserBrands = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).populate(
      'followedBrands',
      'name logoPath category websiteUrl followerCount'
    );

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    res.status(200).json({
      success: true,
      brands: user.followedBrands
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/* UPDATE - Follow/Unfollow User */
export const followUser = async (req, res) => {
  try {
    const { id, targetUserId } = req.params;

    if (id === targetUserId) {
      return res.status(400).json({ 
        success: false,
        message: "You cannot follow yourself" 
      });
    }

    const user = await User.findById(id);
    const targetUser = await User.findById(targetUserId);

    if (!user || !targetUser) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    const isFollowing = user.following.includes(targetUserId);

    if (isFollowing) {
      // Unfollow
      user.following = user.following.filter(
        (uid) => uid.toString() !== targetUserId
      );
      targetUser.followers = targetUser.followers.filter(
        (uid) => uid.toString() !== id
      );
    } else {
      // Follow
      user.following.push(targetUserId);
      targetUser.followers.push(id);
    }

    await user.save();
    await targetUser.save();

    // Return updated following list
    const updatedUser = await User.findById(id).populate(
      'following',
      'userName name bio city picturePath'
    );

    res.status(200).json({
      success: true,
      message: isFollowing ? "User unfollowed" : "User followed",
      following: updatedUser.following
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/* UPDATE - Follow/Unfollow Brand */
export const followBrand = async (req, res) => {
  try {
    const { userId } = req.params;
    const { brandId } = req.body;

    const user = await User.findById(userId);
    const brand = await Brand.findById(brandId);

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    if (!brand) {
      return res.status(404).json({ 
        success: false,
        message: "Brand not found" 
      });
    }

    const isFollowing = user.followedBrands.some(
      (id) => id.toString() === brandId
    );

    if (isFollowing) {
      // Unfollow brand
      user.followedBrands = user.followedBrands.filter(
        (id) => id.toString() !== brandId
      );
      brand.followers = brand.followers.filter(
        (id) => id.toString() !== userId
      );
    } else {
      // Follow brand
      user.followedBrands.push(brandId);
      brand.followers.push(userId);
    }

    await user.save();
    await brand.save();

    // Return updated brands list
    const updatedUser = await User.findById(userId).populate(
      'followedBrands',
      'name logoPath category'
    );

    res.status(200).json({
      success: true,
      message: isFollowing ? "Brand unfollowed" : "Brand followed",
      brands: updatedUser.followedBrands
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/* UPDATE - Update User Profile */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const userUpdates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ 
        success: false,
        message: `Invalid user ID: ${id}` 
      });
    }

    // Don't allow updating sensitive fields
    delete userUpdates.password;
    delete userUpdates.email;
    delete userUpdates.followers;
    delete userUpdates.following;
    delete userUpdates.followedBrands;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      userUpdates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false,
        message: `No user with id: ${id}` 
      });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      user: updatedUser
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/* UPDATE - Update Notification Settings */
export const updateNotificationSettings = async (req, res) => {
  try {
    const { userId } = req.params;
    const { notificationSettings } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { notificationSettings },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification settings updated",
      notificationSettings: user.notificationSettings
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/* SEARCH - Search Users */
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ 
        success: false,
        message: "Search query is required" 
      });
    }

    const users = await User.find({
      $or: [
        { userName: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } }
      ]
    })
    .select('userName name picturePath bio')
    .limit(20);

    res.status(200).json({
      success: true,
      users
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};