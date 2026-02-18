import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';
import { User } from '../types';

export class AuthService {
  private jwtSecret: string;
  private jwtExpiresIn: string;

  constructor(private userModel: UserModel) {
    this.jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
  }

  async register(email: string, password: string): Promise<{
    user: {
      id: string;
      email: string;
      apiKey: string;
      isActive: boolean;
    };
  }> {
    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    if (!this.isValidPassword(password)) {
      throw new Error('Password must be at least 8 characters');
    }

    const existingUser = await this.userModel.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const apiKey = this.userModel.generateApiKey();

    const user = await this.userModel.create({
      email,
      passwordHash,
      apiKey,
      isActive: true
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        apiKey: user.apiKey,
        isActive: user.isActive
      }
    };
  }

  async login(email: string, password: string): Promise<{
    user: {
      id: string;
      email: string;
      apiKey: string;
      isActive: boolean;
    };
    token: string;
  }> {
    const user = await this.userModel.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email
      },
      this.jwtSecret,
      {}
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        apiKey: user.apiKey,
        isActive: user.isActive
      },
      token
    };
  }

  async validateApiKey(apiKey: string): Promise<{
    id: string;
    email: string;
    apiKey: string;
    isActive: boolean;
  } | null> {
    const user = await this.userModel.findByApiKey(apiKey);

    if (!user || !user.isActive) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      apiKey: user.apiKey,
      isActive: user.isActive
    };
  }

  async verifyToken(token: string): Promise<{
    userId: string;
    email: string;
  }> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      return {
        userId: decoded.userId,
        email: decoded.email
      };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async generateApiKey(userId: string): Promise<{
    id: string;
    email: string;
    apiKey: string;
    isActive: boolean;
  }> {
    const newApiKey = this.userModel.generateApiKey();
    const updatedUser = await this.userModel.updateApiKey(userId, newApiKey);

    if (!updatedUser) {
      throw new Error('Failed to generate new API key');
    }

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      apiKey: updatedUser.apiKey,
      isActive: updatedUser.isActive
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    if (!this.isValidPassword(newPassword)) {
      throw new Error('New password must be at least 8 characters');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash) as boolean;
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    await this.userModel.updatePassword(userId, newPasswordHash);
  }

  async deactivateUser(userId: string): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await this.userModel.updateActiveStatus(userId, false);
  }

  async activateUser(userId: string): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await this.userModel.updateActiveStatus(userId, true);
  }

  async resetPassword(email: string): Promise<string> {
    const user = await this.userModel.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    const resetToken = this.generateResetToken();
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    // In a real implementation, you would store this reset token in the database
    // For now, we'll just return the token
    return resetToken;
  }

  async validateResetToken(token: string): Promise<boolean> {
    // In a real implementation, you would validate against stored reset tokens
    // For now, we'll just check if it's a valid format
    return token.length === 64 && /^[a-f0-9]+$/i.test(token);
  }

  async getUserProfile(userId: string): Promise<{
    id: string;
    email: string;
    apiKey: string;
    isActive: boolean;
    createdAt: Date;
  } | null> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      apiKey: user.apiKey,
      isActive: user.isActive,
      createdAt: user.createdAt
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidPassword(password: string): boolean {
    return password && password.length >= 8;
  }

  private generateResetToken(): string {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < 64; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return result;
  }

  async refreshToken(oldToken: string): Promise<{
    token: string;
    user: {
      id: string;
      email: string;
      apiKey: string;
      isActive: boolean;
    };
  }> {
    try {
      const decoded = await this.verifyToken(oldToken);
      const user = await this.userModel.findById(decoded.userId);

      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      const newToken = jwt.sign(
        {
          userId: user.id,
          email: user.email
        },
        this.jwtSecret,
        {}
      );

      return {
        token: newToken,
        user: {
          id: user.id,
          email: user.email,
          apiKey: user.apiKey,
          isActive: user.isActive
        }
      };
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}