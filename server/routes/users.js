import express from "express";
import {
  getUser,
  getUserFollowers,
  getUserFollowing,
  getUserBrands,
  followUser,
  followBrand,
  updateUser,
  updateNotificationSettings,
  searchUsers
} from "../controllers/users.js";
import { verifyToken, verifyOwnership } from "../middleware/auth.js";
import { validateObjectId, sanitizeInput } from "../middleware/validation.js";

const router = express.Router();

/* READ - Get user by ID */
router.get(
  "/:id",
  validateObjectId('id'),
  verifyToken,
  getUser
);

/* READ - Get user's followers */
router.get(
  "/:id/followers",
  validateObjectId('id'),
  verifyToken,
  getUserFollowers
);

/* READ - Get user's following */
router.get(
  "/:id/following",
  validateObjectId('id'),
  verifyToken,
  getUserFollowing
);

/* READ - Get user's followed brands */
router.get(
  "/:id/brands",
  validateObjectId('id'),
  verifyToken,
  getUserBrands
);

/* GET - Search users */
router.get(
  "/search/query",
  verifyToken,
  searchUsers
);

/* PUT - Follow/Unfollow user */
router.put(
  "/:id/follow/:targetUserId",
  validateObjectId('id'),
  validateObjectId('targetUserId'),
  verifyToken,
  verifyOwnership('id'),
  followUser
);

/* POST - Follow/Unfollow brand */
router.post(
  "/:userId/brands/follow",
  validateObjectId('userId'),
  verifyToken,
  verifyOwnership('userId'),
  followBrand
);

/* PATCH - Update user profile */
router.patch(
  "/:id",
  validateObjectId('id'),
  verifyToken,
  verifyOwnership('id'),
  sanitizeInput,
  updateUser
);

/* PATCH - Update notification settings */
router.patch(
  "/:userId/notifications/settings",
  validateObjectId('userId'),
  verifyToken,
  verifyOwnership('userId'),
  updateNotificationSettings
);

export default router;