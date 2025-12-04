import jwt from "jsonwebtoken";
import User from "../models/User.js";

/* Verify JWT Token */
export const verifyToken = async (req, res, next) => {
  try {
    let token = req.header("Authorization");

    if (!token) {
      return res.status(403).json({
        success: false,
        message: "Access denied. No token provided."
      });
    }

    // Remove 'Bearer ' prefix if present
    if (token.startsWith("Bearer ")) {
      token = token.slice(7).trimStart();
    }

    // Verify token
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user info to request
    req.user = verified;
    req.userId = verified.id;

    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: "Invalid token"
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: "Token expired"
      });
    }

    res.status(500).json({
      success: false,
      message: "Error verifying token",
      error: err.message
    });
  }
};

/* Verify Token and Check User Exists */
export const verifyTokenAndUser = async (req, res, next) => {
  try {
    let token = req.header("Authorization");

    if (!token) {
      return res.status(403).json({
        success: false,
        message: "Access denied. No token provided."
      });
    }

    // Remove 'Bearer ' prefix if present
    if (token.startsWith("Bearer ")) {
      token = token.slice(7).trimStart();
    }

    // Verify token
    const verified = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user exists and is active
    const user = await User.findById(verified.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "User account is inactive"
      });
    }

    // Attach user info to request
    req.user = user;
    req.userId = user._id;

    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: "Invalid token"
      });
    }
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: "Token expired"
      });
    }

    res.status(500).json({
      success: false,
      message: "Error verifying token",
      error: err.message
    });
  }
};

/* Verify User Owns Resource */
export const verifyOwnership = (resourceIdParam = 'id') => {
  return (req, res, next) => {
    try {
      const resourceUserId = req.params[resourceIdParam];
      const requestingUserId = req.userId || req.user.id;

      if (resourceUserId !== requestingUserId.toString()) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You don't have permission to perform this action."
        });
      }

      next();
    } catch (err) {
      res.status(500).json({
        success: false,
        message: "Error verifying ownership",
        error: err.message
      });
    }
  };
};

/* Optional Auth - Token is optional, but if provided it will be verified */
export const optionalAuth = async (req, res, next) => {
  try {
    let token = req.header("Authorization");

    if (!token) {
      // No token provided, continue without auth
      req.user = null;
      req.userId = null;
      return next();
    }

    // Remove 'Bearer ' prefix if present
    if (token.startsWith("Bearer ")) {
      token = token.slice(7).trimStart();
    }

    // Verify token
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user info to request
    req.user = verified;
    req.userId = verified.id;

    next();
  } catch (err) {
    // If token is invalid, continue without auth
    req.user = null;
    req.userId = null;
    next();
  }
};