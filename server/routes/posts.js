import express from 'express';
import {
  createPost,
  getFeedPosts,
  getUserPosts,
  getPostById,
  likePost,
  addComment,
  likeComment,
  deletePost
} from "../controllers/posts.js";
import { verifyToken } from "../middleware/auth.js";
import { validateObjectId, validateRequiredFields, sanitizeInput } from "../middleware/validation.js";

const router = express.Router();

/* CREATE - Create new post */
router.post(
  '/',
  verifyToken,
  sanitizeInput,
  validateRequiredFields(['userId', 'description']),
  createPost
);

/* READ - Get feed posts (paginated) */
router.get(
  '/',
  verifyToken,
  getFeedPosts
);

/* READ - Get user's posts */
router.get(
  '/user/:userId',
  validateObjectId('userId'),
  verifyToken,
  getUserPosts
);

/* READ - Get single post by ID */
router.get(
  '/:postId',
  validateObjectId('postId'),
  verifyToken,
  getPostById
);

/* PATCH - Like/Unlike post */
router.patch(
  '/:id/like',
  validateObjectId('id'),
  verifyToken,
  validateRequiredFields(['userId']),
  likePost
);

/* POST - Add comment to post */
router.post(
  '/:postId/comments',
  validateObjectId('postId'),
  verifyToken,
  validateRequiredFields(['userId', 'comment']),
  addComment
);

/* PATCH - Like/Unlike comment */
router.patch(
  '/:postId/comments/:commentId/like',
  validateObjectId('postId'),
  verifyToken,
  validateRequiredFields(['userId']),
  likeComment
);

/* DELETE - Delete post */
router.delete(
  '/:postId',
  validateObjectId('postId'),
  verifyToken,
  validateRequiredFields(['userId']),
  deletePost
);

export default router;