import express from "express";
// Import from JSON-based controller for now
import {
  getAllBrands,
  getBrand,
  searchBrands,
  followBrand,
  getUserFollowedBrands
} from "../controllers/brandsFromJSON.js";
import { verifyToken, verifyOwnership } from "../middleware/auth.js";
import { validateObjectId } from "../middleware/validation.js";

const router = express.Router();

/* GET - Get all brands */
router.get("/", verifyToken, getAllBrands);

/* GET - Search brands */
router.get("/search/query", verifyToken, searchBrands);

/* GET - Get single brand */
router.get("/:id", validateObjectId('id'), verifyToken, getBrand);

/* GET - Get user's followed brands */
router.get(
  "/user/:userId/following",
  validateObjectId('userId'),
  verifyToken,
  getUserFollowedBrands
);

/* POST - Follow/Unfollow brand */
router.post(
  "/user/:userId/follow",
  validateObjectId('userId'),
  verifyToken,
  verifyOwnership('userId'),
  followBrand
);

export default router;