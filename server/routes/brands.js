import express from "express";
import {
  createBrand,
  getAllBrands,
  getBrand,
  getPopularBrands,
  updateBrand,
  deleteBrand,
  searchBrands
} from "../controllers/brands.js";
import { verifyToken } from "../middleware/auth.js";
import { validateObjectId, validateRequiredFields, sanitizeInput } from "../middleware/validation.js";

const router = express.Router();

/* CREATE - Create new brand */
router.post(
  '/',
  verifyToken,
  sanitizeInput,
  validateRequiredFields(['name', 'description', 'logoPath', 'websiteUrl']),
  createBrand
);

/* READ - Get all brands */
router.get(
  '/',
  verifyToken,
  getAllBrands
);

/* READ - Get popular brands */
router.get(
  '/popular',
  verifyToken,
  getPopularBrands
);

/* GET - Search brands */
router.get(
  '/search/query',
  verifyToken,
  searchBrands
);

/* READ - Get single brand */
router.get(
  '/:id',
  validateObjectId('id'),
  verifyToken,
  getBrand
);

/* PATCH - Update brand */
router.patch(
  '/:id',
  validateObjectId('id'),
  verifyToken,
  sanitizeInput,
  updateBrand
);

/* DELETE - Delete brand */
router.delete(
  '/:id',
  validateObjectId('id'),
  verifyToken,
  deleteBrand
);

export default router;