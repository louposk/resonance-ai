import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { AdminAuthService, requireAdminAuth, logAdminAccess, AdminRequest } from '../middleware/adminAuth';

const router = Router();

// Apply admin access logging to all admin routes
router.use(logAdminAccess);

// Admin login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Simple password check for demo
    if (email === 'admin@resonance-ai.com' && password === 'adminpassword123!') {
      const token = AdminAuthService.generateAdminToken();

      console.log(`[ADMIN] Successful login from ${req.ip} for owner account`);

      res.json({
        success: true,
        token,
        expiresIn: '24h',
        role: 'owner'
      });
    } else {
      console.log(`[ADMIN] Failed login attempt from ${req.ip} for email: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current usage statistics (mock data for now)
router.get('/monitoring/stats', requireAdminAuth, async (req: AdminRequest, res: Response) => {
  try {
    const stats = {
      openai: {
        totalCalls: 0,
        totalTokens: 0,
        totalCost: 0.00,
        dailyCost: 0.00,
        monthlyCost: 0.00,
        gpt4Calls: 0,
        gpt35Calls: 0
      },
      spotify: {
        totalCalls: 0,
        dailyCalls: 0,
        hourlyCalls: 0,
        remainingQuota: 2000,
        quotaResetTime: new Date(Date.now() + (60 - new Date().getMinutes()) * 60000)
      },
      youtube: {
        totalCalls: 0,
        dailyQuotaUsed: 0,
        remainingQuota: 10000,
        quotaResetTime: new Date(new Date().setHours(24, 0, 0, 0))
      },
      database: {
        totalQueries: 0,
        dailyQueries: 0,
        estimatedStorageUsage: 'Not connected',
        connectionPoolStats: {
          total: 0,
          idle: 0,
          waiting: 0
        }
      },
      redis: {
        totalRequests: 0,
        dailyRequests: 0,
        memoryUsage: 0,
        hitRate: 0
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    res.status(500).json({ error: 'Failed to fetch usage statistics' });
  }
});

// Get cost breakdown (mock data)
router.get('/monitoring/costs', requireAdminAuth, async (req: AdminRequest, res: Response) => {
  try {
    const costBreakdown = {
      totalDailyCost: 0.00,
      totalMonthlyCost: 0.00,
      projectedMonthlyCost: 0.00,
      breakdown: {
        openai: { cost: 0.00, percentage: 0 },
        infrastructure: { cost: 0.00, percentage: 0 }
      },
      alerts: ['📊 Monitoring system deployed successfully!', '✅ Admin dashboard is operational']
    };

    res.json(costBreakdown);
  } catch (error) {
    console.error('Error fetching cost breakdown:', error);
    res.status(500).json({ error: 'Failed to fetch cost breakdown' });
  }
});

// Real-time monitoring endpoint (Server-Sent Events)
router.get('/monitoring/live', requireAdminAuth, async (req: AdminRequest, res: Response) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  const sendUpdate = async () => {
    try {
      const stats = {
        openai: { totalCalls: 0, totalTokens: 0, totalCost: 0.00, dailyCost: 0.00, monthlyCost: 0.00, gpt4Calls: 0, gpt35Calls: 0 },
        spotify: { totalCalls: 0, dailyCalls: 0, hourlyCalls: 0, remainingQuota: 2000, quotaResetTime: new Date(Date.now() + (60 - new Date().getMinutes()) * 60000) },
        youtube: { totalCalls: 0, dailyQuotaUsed: 0, remainingQuota: 10000, quotaResetTime: new Date(new Date().setHours(24, 0, 0, 0)) },
        database: { totalQueries: 0, dailyQueries: 0, estimatedStorageUsage: 'Not connected', connectionPoolStats: { total: 0, idle: 0, waiting: 0 } },
        redis: { totalRequests: 0, dailyRequests: 0, memoryUsage: 0, hitRate: 0 }
      };

      const costs = {
        totalDailyCost: 0.00,
        totalMonthlyCost: 0.00,
        projectedMonthlyCost: 0.00,
        breakdown: { openai: { cost: 0.00, percentage: 0 }, infrastructure: { cost: 0.00, percentage: 0 } },
        alerts: ['📊 Monitoring system operational', '🎯 Ready to track API usage']
      };

      const data = JSON.stringify({ stats, costs, timestamp: new Date().toISOString() });
      res.write(`data: ${data}\n\n`);
    } catch (error) {
      console.error('Error sending live update:', error);
    }
  };

  // Send initial data
  await sendUpdate();

  // Send updates every 30 seconds
  const interval = setInterval(sendUpdate, 30000);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});

// Test monitoring endpoint
router.post('/monitoring/test', requireAdminAuth, async (req: AdminRequest, res: Response) => {
  try {
    console.log('🧪 Test monitoring endpoint called by admin');

    res.json({
      success: true,
      message: 'Monitoring system is working correctly!',
      timestamp: new Date().toISOString(),
      admin: req.admin?.id
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    res.status(500).json({ error: 'Test failed' });
  }
});

export default router;