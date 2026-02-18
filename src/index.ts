import { createApp, initializeApp } from './app';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    console.log('🎵 Starting Music Information API...');

    // Initialize the application
    await initializeApp();

    // Create Express app
    const app = createApp();

    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📖 API Documentation: http://localhost:${PORT}/api`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log(`🎨 Web Interface: http://localhost:${PORT}`);
      console.log('');
      console.log('Environment:', process.env.NODE_ENV || 'development');
      console.log('');
      console.log('Ready to analyze music! 🎶');
    });

    // Graceful shutdown handling
    const gracefulShutdown = () => {
      console.log('\n🔄 Received shutdown signal. Shutting down gracefully...');

      server.close(async () => {
        console.log('✅ HTTP server closed.');

        try {
          // Close database connections
          const { database } = await import('./config/database');
          await database.close();
          console.log('✅ Database connections closed.');

          // Close cache connections
          const { CacheService } = await import('./services/CacheService');
          const cacheService = new CacheService();
          if (cacheService.isConnected()) {
            await cacheService.disconnect();
            console.log('✅ Cache connections closed.');
          }

          console.log('👋 Graceful shutdown complete.');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });
    };

    // Handle shutdown signals
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();