import express from 'express';
import { login, register, updatePushToken, verifyToken as verifyTokenController } from '../controllers/auth.js';
import { verifyToken } from '../middleware/auth.js';
import { validateRequiredFields, sanitizeInput } from '../middleware/validation.js';

const router = express.Router();

/* POST - Register new user */
router.post(
  '/register', 
  sanitizeInput,
  validateRequiredFields(['userName', 'name', 'email', 'password']),
  register
);

/* POST - Login */
router.post(
  '/login',
  sanitizeInput,
  validateRequiredFields(['email', 'password']),
  login
);

/* POST - Verify token */
router.post('/verify', verifyTokenController);

/* PUT - Update push token (for mobile notifications) */
router.put(
  '/:userId/push-token',
  verifyToken,
  validateRequiredFields(['pushToken']),
  updatePushToken
);

export default router;