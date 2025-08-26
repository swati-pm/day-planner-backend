import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { findUserById, findOrCreateUserByGoogle, User } from '../models/User';

// Extend the Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Generate JWT token for user
 */
export const generateToken = (user: User): string => {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
};

/**
 * Verify Google ID token
 */
export const verifyGoogleToken = async (idToken: string): Promise<{
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified?: boolean;
}> => {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    
    if (!payload) {
      throw new Error('Invalid Google token payload');
    }
    
    return {
      id: payload.sub,
      email: payload.email!,
      name: payload.name!,
      picture: payload.picture,
      verified: payload.email_verified
    };
  } catch (error) {
    throw new Error('Invalid Google token');
  }
};

/**
 * Authentication middleware - verifies JWT token
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Access token is required'
      });
      return;
    }
    
    const decoded = verifyToken(token);
    const user = await findUserById(decoded.userId);
    
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'User not found'
      });
      return;
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or expired token'
    });
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      const decoded = verifyToken(token);
      const user = await findUserById(decoded.userId);
      
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Don't fail, just continue without user
    next();
  }
};

/**
 * Google OAuth login flow
 */
export const authenticateGoogle = async (idToken: string): Promise<{
  user: User;
  token: string;
}> => {
  try {
    // Verify Google token and get user profile
    const googleProfile = await verifyGoogleToken(idToken);
    
    // Find or create user
    const user = await findOrCreateUserByGoogle(googleProfile);
    
    // Generate JWT token
    const token = generateToken(user);
    
    return { user, token };
  } catch (error) {
    throw new Error('Google authentication failed');
  }
};
