import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';

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

  // CORS - Allow production domain and Chrome extension
  app.use(cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://resonanceaimusic.com',
      /^chrome-extension:\/\/.*/
    ],
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

  // Static files for UI - determine the correct public path
  const publicPath = path.join(__dirname, 'public');
  console.log('Serving static files from:', publicPath);
  app.use(express.static(publicPath));

  // Serve the UI at root
  app.get('/', (req, res) => {
    try {
      const indexPath = path.join(publicPath, 'index.html');
      console.log('Attempting to serve:', indexPath);
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error('Error serving index.html:', err);
          res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Resonance AI Music</title>
              <style>
                body { font-family: Arial, sans-serif; background: #1a1a1a; color: white; text-align: center; padding: 50px; }
                .error { background: #2d1b69; padding: 20px; border-radius: 10px; max-width: 600px; margin: 0 auto; }
              </style>
            </head>
            <body>
              <div class="error">
                <h1>🎵 Resonance AI Music</h1>
                <p>Welcome to Resonance AI Music Platform!</p>
                <p>The full interface is currently being loaded...</p>
                <p><a href="/api" style="color: #8b5cf6;">View API Documentation</a></p>
                <p><a href="/health" style="color: #8b5cf6;">Health Check</a></p>
              </div>
            </body>
            </html>
          `);
        }
      });
    } catch (error) {
      console.error('Error in root route:', error);
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Resonance AI Music</title>
          <style>
            body { font-family: Arial, sans-serif; background: #1a1a1a; color: white; text-align: center; padding: 50px; }
            .error { background: #2d1b69; padding: 20px; border-radius: 10px; max-width: 600px; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="error">
            <h1>🎵 Resonance AI Music</h1>
            <p>Welcome to Resonance AI Music Platform!</p>
            <p><a href="/api" style="color: #8b5cf6;">View API Documentation</a></p>
            <p><a href="/health" style="color: #8b5cf6;">Health Check</a></p>
          </div>
        </body>
        </html>
      `);
    }
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