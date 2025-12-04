import express from "express";
import {
  createRelease,
  getFeedReleases,
  getUpcomingReleases,
  getRelease,
  getBrandReleases,
  getFollowedBrandsReleases,
  saveRelease,
  updateRelease,
  deleteRelease,
  searchReleases
} from "../controllers/releases.js";
import { verifyToken } from "../middleware/auth.js";
import { validateObjectId, validateRequiredFields, sanitizeInput } from "../middleware/validation.js";

const router = express.Router();

/* CREATE - Create new release */
router.post(
  '/',
  verifyToken,
  sanitizeInput,
  validateRequiredFields(['brandId', 'name', 'description', 'releaseDate', 'purchaseUrl']),
  createRelease
);

/* READ - Get all releases (feed) */
router.get(
  '/',
  verifyToken,
  getFeedReleases
);

/* READ - Get upcoming releases */
router.get(
  '/upcoming',
  verifyToken,
  getUpcomingReleases
);

/* READ - Get user's followed brands releases */
router.get(
  '/following/:userId',
  validateObjectId('userId'),
  verifyToken,
  getFollowedBrandsReleases
);

/* GET - Search releases */
router.get(
  '/search/query',
  verifyToken,
  searchReleases
);

/* READ - Get single release */
router.get(
  '/:id',
  validateObjectId('id'),
  verifyToken,
  getRelease
);

/* READ - Get releases by brand */
router.get(
  '/brand/:brandId',
  validateObjectId('brandId'),
  verifyToken,
  getBrandReleases
);

/* PATCH - Save/Unsave release */
router.patch(
  '/:id/save',
  validateObjectId('id'),
  verifyToken,
  validateRequiredFields(['userId']),
  saveRelease
);

/* PATCH - Update release */
router.patch(
  '/:id',
  validateObjectId('id'),
  verifyToken,
  sanitizeInput,
  updateRelease
);

/* DELETE - Delete release */
router.delete(
  '/:id',
  validateObjectId('id'),
  verifyToken,
  deleteRelease
);

export default router;