import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { generalRateLimit } from '../middleware/rateLimiting';

const router = Router();

// Apply rate limiting
router.use(generalRateLimit);

// Demo users (in production, this would be in a database)
const demoUsers = [
  {
    id: 'demo-user-1',
    email: 'demo@resonance-ai.com',
    password: 'demo123',
    apiKey: 'demo-api-key-12345'
  }
];

// User registration (demo mode)
router.post('/register', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // In demo mode, just return success
    const demoUser = {
      id: 'demo-user-' + Date.now(),
      email,
      apiKey: 'demo-api-key-' + Math.random().toString(36).substring(7)
    };

    const token = jwt.sign(
      { id: demoUser.id, email: demoUser.email },
      process.env.JWT_SECRET || 'demo-secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Demo user registered successfully',
      user: demoUser,
      token,
      demo: true,
      note: 'Demo mode - user data is not persisted'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

// User login (demo mode)
router.post('/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Check demo user
    const user = demoUsers.find(u => u.email === email && u.password === password);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Try demo@resonance-ai.com / demo123'
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'demo-secret',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        apiKey: user.apiKey
      },
      token,
      demo: true
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// Generate API key (demo mode)
router.post('/api-key', (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // In demo mode, just generate a demo API key
    const newApiKey = 'demo-api-key-' + Math.random().toString(36).substring(7);

    res.json({
      success: true,
      apiKey: newApiKey,
      demo: true,
      note: 'Demo API key - use for testing endpoints'
    });

  } catch (error) {
    console.error('API key generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate API key'
    });
  }
});

// Get user profile (demo mode)
router.get('/profile', (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // In demo mode, return demo profile
    res.json({
      success: true,
      profile: {
        id: 'demo-user-1',
        email: 'demo@resonance-ai.com',
        apiKey: 'demo-api-key-12345',
        created: '2024-01-01',
        usage: {
          searches: 42,
          analyses: 15,
          lastActive: new Date().toISOString()
        }
      },
      demo: true
    });

  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile'
    });
  }
});

export default router;