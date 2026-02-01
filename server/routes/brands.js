import express from "express";
import {
  getAllBrands,
  getBrand,
  searchBrands
} from "../controllers/brands.js";  // ✅ Using MongoDB controller
import { verifyToken, verifyOwnership } from "../middleware/auth.js";
import { validateObjectId } from "../middleware/validation.js";

const router = express.Router();

/* GET - Get all brands */
router.get("/", verifyToken, getAllBrands);

/* GET - Search brands */
router.get("/search/query", verifyToken, searchBrands);

/* GET - Get single brand */
router.get("/:id", validateObjectId('id'), verifyToken, getBrand);

export default router;