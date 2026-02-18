import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { AuthService } from '../services/AuthService';
import { UserModel } from '../models/User';
import { database } from '../config/database';
import Joi from 'joi';

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(8).required()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: error.details[0].message
        });
        return;
      }

      const client = await database.getClient();
      const userModel = new UserModel(client);
      const authService = new AuthService(userModel);

      try {
        const result = await authService.register(value.email, value.password);

        res.status(201).json({
          success: true,
          data: result,
          message: 'User registered successfully'
        });
      } finally {
        client.release();
      }
    } catch (error: any) {
      console.error('Registration error:', error);

      if (error.message === 'User already exists') {
        res.status(409).json({
          success: false,
          error: 'User already exists'
        });
        return;
      }

      if (error.message === 'Invalid email format' || error.message.includes('Password')) {
        res.status(400).json({
          success: false,
          error: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Registration failed'
      });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: error.details[0].message
        });
        return;
      }

      const client = await database.getClient();
      const userModel = new UserModel(client);
      const authService = new AuthService(userModel);

      try {
        const result = await authService.login(value.email, value.password);

        res.json({
          success: true,
          data: result,
          message: 'Login successful'
        });
      } finally {
        client.release();
      }
    } catch (error: any) {
      console.error('Login error:', error);

      if (error.message === 'Invalid credentials' || error.message === 'Account is deactivated') {
        res.status(401).json({
          success: false,
          error: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Login failed'
      });
    }
  }

  async generateApiKey(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const client = await database.getClient();
      const userModel = new UserModel(client);
      const authService = new AuthService(userModel);

      try {
        const result = await authService.generateApiKey(req.user.id);

        res.json({
          success: true,
          data: result,
          message: 'New API key generated successfully'
        });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Generate API key error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate API key'
      });
    }
  }

  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const client = await database.getClient();
      const userModel = new UserModel(client);
      const authService = new AuthService(userModel);

      try {
        const profile = await authService.getUserProfile(req.user.id);

        if (!profile) {
          res.status(404).json({
            success: false,
            error: 'User profile not found'
          });
          return;
        }

        res.json({
          success: true,
          data: profile
        });
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user profile'
      });
    }
  }

  async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const schema = Joi.object({
        currentPassword: Joi.string().required(),
        newPassword: Joi.string().min(8).required()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: error.details[0].message
        });
        return;
      }

      const client = await database.getClient();
      const userModel = new UserModel(client);
      const authService = new AuthService(userModel);

      try {
        await authService.changePassword(req.user.id, value.currentPassword, value.newPassword);

        res.json({
          success: true,
          message: 'Password changed successfully'
        });
      } finally {
        client.release();
      }
    } catch (error: any) {
      console.error('Change password error:', error);

      if (error.message === 'Current password is incorrect' || error.message.includes('Password')) {
        res.status(400).json({
          success: false,
          error: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to change password'
      });
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const schema = Joi.object({
        token: Joi.string().required()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: error.details[0].message
        });
        return;
      }

      const client = await database.getClient();
      const userModel = new UserModel(client);
      const authService = new AuthService(userModel);

      try {
        const result = await authService.refreshToken(value.token);

        res.json({
          success: true,
          data: result,
          message: 'Token refreshed successfully'
        });
      } finally {
        client.release();
      }
    } catch (error: any) {
      console.error('Refresh token error:', error);

      if (error.message.includes('Invalid') || error.message.includes('expired')) {
        res.status(401).json({
          success: false,
          error: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to refresh token'
      });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const schema = Joi.object({
        email: Joi.string().email().required()
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          error: error.details[0].message
        });
        return;
      }

      const client = await database.getClient();
      const userModel = new UserModel(client);
      const authService = new AuthService(userModel);

      try {
        const resetToken = await authService.resetPassword(value.email);

        res.json({
          success: true,
          data: { resetToken },
          message: 'Password reset token generated (in production, this would be sent via email)'
        });
      } finally {
        client.release();
      }
    } catch (error: any) {
      console.error('Reset password error:', error);

      if (error.message === 'User not found') {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to reset password'
      });
    }
  }
}