import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export interface AdminRequest extends Request {
  admin?: {
    id: string;
    role: 'owner';
  };
}

export class AdminAuthService {
  private static readonly ADMIN_EMAIL = 'admin@resonance-ai.com';
  private static readonly ADMIN_ROLE = 'owner';

  static async verifyAdminCredentials(email: string, password: string): Promise<boolean> {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      throw new Error('Admin password not configured');
    }

    if (email !== this.ADMIN_EMAIL) {
      return false;
    }

    return bcrypt.compare(password, await bcrypt.hash(adminPassword, 10));
  }

  static generateAdminToken(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT secret not configured');
    }

    return jwt.sign(
      {
        id: 'admin-owner',
        email: this.ADMIN_EMAIL,
        role: this.ADMIN_ROLE,
        isAdmin: true
      },
      secret,
      { expiresIn: '24h' }
    );
  }

  static verifyAdminToken(token: string): any {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT secret not configured');
    }

    const decoded = jwt.verify(token, secret) as any;
    if (!decoded.isAdmin || decoded.role !== this.ADMIN_ROLE) {
      throw new Error('Invalid admin token');
    }

    return decoded;
  }

  static verifyAdminApiKey(apiKey: string): boolean {
    const adminApiKey = process.env.ADMIN_API_KEY;
    return adminApiKey && apiKey === adminApiKey;
  }
}

export const requireAdminAuth = (req: AdminRequest, res: Response, next: NextFunction): void => {
  try {
    // Check for API key in header
    const apiKey = req.headers['x-admin-api-key'] as string;
    if (apiKey && AdminAuthService.verifyAdminApiKey(apiKey)) {
      req.admin = { id: 'admin-owner', role: 'owner' };
      return next();
    }

    // Check for JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Admin authentication required' });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = AdminAuthService.verifyAdminToken(token);

    req.admin = {
      id: decoded.id,
      role: decoded.role
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid admin credentials' });
  }
};

export const optionalAdminAuth = (req: AdminRequest, res: Response, next: NextFunction): void => {
  try {
    const apiKey = req.headers['x-admin-api-key'] as string;
    const authHeader = req.headers.authorization;

    if (apiKey && AdminAuthService.verifyAdminApiKey(apiKey)) {
      req.admin = { id: 'admin-owner', role: 'owner' };
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = AdminAuthService.verifyAdminToken(token);
      req.admin = { id: decoded.id, role: decoded.role };
    }

    next();
  } catch (error) {
    next();
  }
};

export const logAdminAccess = (req: AdminRequest, res: Response, next: NextFunction): void => {
  if (req.admin) {
    console.log(`[ADMIN ACCESS] ${req.admin.role} ${req.admin.id} - ${req.method} ${req.path} - ${req.ip} - ${new Date().toISOString()}`);
  }
  next();
};