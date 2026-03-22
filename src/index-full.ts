import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import songRoutes from './routes/songs-simple';
import authRoutes from './routes/auth-simple';
import adminRoutes from './routes/admin-simple';
import { generalRateLimit } from './middleware/rateLimiting';

dotenv.config();

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// General rate limiting
app.use(generalRateLimit);

// Health check
app.get('/health', async (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'full-resonance-ai'
  });
});

// API routes - Full functionality
app.use('/api/songs', songRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// API documentation
app.get('/api', (req, res) => {
  res.json({
    name: 'Resonance AI - Music Intelligence API',
    version: '1.0.0',
    description: 'API for retrieving song information, meanings, and trivia using AI analysis',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register new user',
        'POST /api/auth/login': 'Login user',
        'POST /api/auth/refresh': 'Refresh JWT token',
        'GET /api/auth/profile': 'Get user profile (JWT required)',
        'PUT /api/auth/password': 'Change password (JWT required)',
        'POST /api/auth/api-key': 'Generate new API key (JWT required)'
      },
      songs: {
        'GET /api/songs/search?q=query&platform=spotify|youtube': 'Search for songs',
        'GET /api/songs/:id': 'Get song by ID',
        'GET /api/songs/:id/analysis': 'Get AI analysis for song',
        'POST /api/songs': 'Create new song',
        'PUT /api/songs/:id': 'Update song',
        'DELETE /api/songs/:id': 'Delete song'
      },
      admin: {
        'POST /api/admin/login': 'Admin login',
        'GET /api/admin/monitoring/stats': 'Usage statistics (admin only)',
        'GET /api/admin/monitoring/costs': 'Cost breakdown (admin only)',
        'GET /api/admin/monitoring/live': 'Live monitoring stream (admin only)'
      }
    },
    authentication: {
      'API Key': 'Include x-api-key header for API access',
      'JWT': 'Include Authorization: Bearer <token> header for user endpoints',
      'Admin': 'Use admin credentials for monitoring features'
    },
    rateLimit: {
      general: '100 requests per 15 minutes',
      search: '20 requests per minute',
      analysis: '10 requests per 5 minutes',
      auth: '5 requests per 15 minutes'
    },
    demo: {
      example: 'GET /api/songs/search?q=Billie Jean Michael Jackson',
      note: 'Demo mode available with limited functionality'
    }
  });
});

// Static files for UI
app.use(express.static('public'));

// Serve the main UI at root
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: 'public' });
});

// Serve admin dashboard
app.get('/admin', (req, res) => {
  res.sendFile('admin.html', { root: 'public' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /api - API documentation',
      'GET /health - Health check',
      'POST /api/auth/register - User registration',
      'POST /api/auth/login - User login',
      'GET /api/songs/search - Song search',
      'GET /api/songs/:id/analysis - Song analysis',
      'GET /admin - Admin dashboard',
      'POST /api/admin/login - Admin login'
    ]
  });
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);

  res.status(error.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
});

export default app;