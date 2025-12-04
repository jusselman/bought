import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

/* REGISTER USER */
export const register = async (req, res) => {
  try {
    const {
      userName,
      name,
      email,
      password,
      birthday,
      bio,
      website,
      city,
      picturePath,
      socialMedia, // Now as an object: { instagram, tiktok, facebook, twitter }
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { userName }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: "User with this email or username already exists" 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      userName,
      name,
      email,
      password: passwordHash,
      birthday: birthday || undefined,
      bio: bio || "",
      website: website || "",
      city: city || "",
      picturePath: picturePath || "",
      socialMedia: socialMedia || {
        instagram: "",
        tiktok: "",
        facebook: "",
        twitter: ""
      },
      followedBrands: [],
      following: [],
      followers: [],
    });

    const savedUser = await newUser.save();

    // Remove password from response
    const userResponse = savedUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: userResponse
    });

  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ 
      success: false,
      message: "Error registering user",
      error: err.message 
    });
  }
};

/* LOGIN */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Email and password are required" 
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    // Update last active
    user.lastActive = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({ 
      success: true,
      token, 
      user: userResponse 
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ 
      success: false,
      message: "Error logging in",
      error: err.message 
    });
  }
};

/* UPDATE PUSH TOKEN (for mobile notifications) */
export const updatePushToken = async (req, res) => {
  try {
    const { userId } = req.params;
    const { pushToken } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { pushToken },
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
      message: "Push token updated successfully",
      user 
    });

  } catch (err) {
    console.error("Update push token error:", err);
    res.status(500).json({ 
      success: false,
      message: "Error updating push token",
      error: err.message 
    });
  }
};

/* VERIFY TOKEN */
export const verifyToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ 
        success: false,
        message: "Token is required" 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

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
    res.status(401).json({ 
      success: false,
      message: "Invalid or expired token" 
    });
  }
};