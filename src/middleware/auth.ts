import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { UserModel } from '../models/User';
import { database } from '../config/database';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    apiKey: string;
    isActive: boolean;
  };
}

export const authenticateApiKey = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      res.status(401).json({
        success: false,
        error: 'API key required'
      });
      return;
    }

    const client = await database.getClient();
    const userModel = new UserModel(client);
    const authService = new AuthService(userModel);

    const user = await authService.validateApiKey(apiKey);
    client.release();

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid API key'
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

export const authenticateJWT = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token required'
      });
      return;
    }

    const client = await database.getClient();
    const userModel = new UserModel(client);
    const authService = new AuthService(userModel);

    const decoded = await authService.verifyToken(token);
    const user = await userModel.findById(decoded.userId);
    client.release();

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      apiKey: user.apiKey,
      isActive: user.isActive
    };

    next();
  } catch (error) {
    console.error('JWT authentication error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!apiKey && !token) {
      next();
      return;
    }

    const client = await database.getClient();
    const userModel = new UserModel(client);
    const authService = new AuthService(userModel);

    let user = null;

    if (apiKey) {
      user = await authService.validateApiKey(apiKey);
    } else if (token) {
      try {
        const decoded = await authService.verifyToken(token);
        const foundUser = await userModel.findById(decoded.userId);
        if (foundUser && foundUser.isActive) {
          user = {
            id: foundUser.id,
            email: foundUser.email,
            apiKey: foundUser.apiKey,
            isActive: foundUser.isActive
          };
        }
      } catch (tokenError) {
        // Invalid token, continue without user
      }
    }

    client.release();
    req.user = user || undefined;
    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next();
  }
};