import { createApp } from './app-demo';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    console.log('🎵 Starting Resonance AI - Demo Mode...');
    console.log('');

    // Create Express app
    const app = createApp();

    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log('');
      console.log(`🎨 Beautiful UI Demo: http://localhost:${PORT}`);
      console.log(`📖 API Documentation: http://localhost:${PORT}/api`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log('');
      console.log('🎯 DEMO MODE - Showcasing the beautiful UI and architecture');
      console.log('💡 For full functionality, set up PostgreSQL, Redis, and API keys');
      console.log('');
      console.log('✨ Enjoy the professional dark theme with fancy colors! ✨');
    });

    // Graceful shutdown handling
    const gracefulShutdown = () => {
      console.log('\n🔄 Shutting down demo server...');
      server.close(() => {
        console.log('✅ Demo server stopped.');
        process.exit(0);
      });
    };

    // Handle shutdown signals
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    console.error('❌ Failed to start demo server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();