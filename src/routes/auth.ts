import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticateJWT, authenticateApiKey } from '../middleware/auth';
import { authRateLimit, generalRateLimit } from '../middleware/rateLimiting';

const router = Router();
const authController = new AuthController();

// Register
router.post('/register', authRateLimit, (req, res) => authController.register(req, res));

// Login
router.post('/login', authRateLimit, (req, res) => authController.login(req, res));

// Refresh token
router.post('/refresh', generalRateLimit, (req, res) => authController.refreshToken(req, res));

// Reset password
router.post('/reset-password', authRateLimit, (req, res) => authController.resetPassword(req, res));

// Protected routes (require JWT authentication)
router.get('/profile', authenticateJWT, generalRateLimit, (req, res) => authController.getProfile(req, res));
router.put('/password', authenticateJWT, generalRateLimit, (req, res) => authController.changePassword(req, res));

// API key management (can use either JWT or API key)
router.post('/api-key', authenticateJWT, generalRateLimit, (req, res) => authController.generateApiKey(req, res));

export default router;