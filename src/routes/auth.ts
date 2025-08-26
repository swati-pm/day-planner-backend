import express from 'express';
import { authenticateGoogle, authenticateToken } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { validate } from '../utils/validation';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const googleAuthSchema = Joi.object({
  idToken: Joi.string().required().messages({
    'string.empty': 'Google ID token is required',
    'any.required': 'Google ID token is required'
  })
});

/**
 * POST /api/auth/google - Authenticate with Google
 */
router.post('/google', 
  validate(googleAuthSchema),
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { idToken } = req.body;
    
    try {
      const { user, token } = await authenticateGoogle(idToken);
      
      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            picture: user.picture,
            verified: user.verified
          },
          token
        },
        message: 'Authentication successful'
      });
    } catch (error) {
      throw createError('Google authentication failed', 401);
    }
  })
);

/**
 * GET /api/auth/me - Get current user info
 */
router.get('/me',
  authenticateToken,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    res.json({
      success: true,
      data: {
        user: {
          id: req.user!.id,
          email: req.user!.email,
          name: req.user!.name,
          picture: req.user!.picture,
          verified: req.user!.verified,
          createdAt: req.user!.createdAt
        }
      }
    });
  })
);

/**
 * POST /api/auth/refresh - Refresh JWT token
 */
router.post('/refresh',
  authenticateToken,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    const { generateToken } = await import('../middleware/auth');
    const newToken = generateToken(req.user!);
    
    res.json({
      success: true,
      data: {
        token: newToken
      },
      message: 'Token refreshed successfully'
    });
  })
);

/**
 * POST /api/auth/logout - Logout (client-side token removal)
 */
router.post('/logout',
  asyncHandler(async (req: express.Request, res: express.Response) => {
    // Since we're using JWT tokens, logout is handled client-side
    // This endpoint is mainly for consistency and future server-side logout logic
    res.json({
      success: true,
      message: 'Logout successful'
    });
  })
);

/**
 * GET /api/auth/verify - Verify token (for debugging)
 */
router.get('/verify',
  authenticateToken,
  asyncHandler(async (req: express.Request, res: express.Response) => {
    res.json({
      success: true,
      data: {
        valid: true,
        user: {
          id: req.user!.id,
          email: req.user!.email,
          name: req.user!.name
        }
      },
      message: 'Token is valid'
    });
  })
);

export default router;

