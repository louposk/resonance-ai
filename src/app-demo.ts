import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

export function createApp() {
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
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
  }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      success: true,
      status: 'healthy - demo mode',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // API documentation
  app.get('/api', (req, res) => {
    res.json({
      name: 'Resonance AI - Demo Mode',
      version: '1.0.0',
      description: 'API for retrieving song information, meanings, and trivia using AI analysis',
      note: 'This is running in demo mode without database connectivity',
      endpoints: {
        demo: {
          'GET /': 'Beautiful UI Demo',
          'GET /health': 'Health check',
          'GET /api': 'This documentation'
        },
        auth: {
          'POST /api/auth/register': 'Register new user (requires database)',
          'POST /api/auth/login': 'Login user (requires database)',
        },
        songs: {
          'GET /api/songs/search': 'Search for songs (requires API keys)',
          'GET /api/songs/:id/analysis': 'Get AI analysis (requires database + AI)',
        }
      },
      setup: {
        database: 'PostgreSQL connection required for full functionality',
        cache: 'Redis connection optional but recommended',
        apiKeys: 'OpenAI, Spotify, and YouTube API keys required'
      }
    });
  });

  // Demo API endpoints
  app.get('/api/songs/search', (req, res) => {
    res.json({
      success: false,
      error: 'Demo mode - database and API keys required for full functionality',
      demo: true,
      message: 'This beautiful UI shows how the application would work with proper setup'
    });
  });

  // Static files for UI
  app.use(express.static('public'));

  // Serve the UI at root
  app.get('/', (req, res) => {
    res.sendFile('index.html', { root: 'public' });
  });

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: 'Endpoint not found - Demo Mode',
      availableEndpoints: [
        'GET /',
        'GET /api',
        'GET /health'
      ]
    });
  });

  // Error handling middleware
  app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', error);

    res.status(error.status || 500).json({
      success: false,
      error: 'Demo mode - Full functionality requires proper setup',
      message: 'See /api for setup instructions'
    });
  });

  return app;
}