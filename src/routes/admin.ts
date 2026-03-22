import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { AdminAuthService, requireAdminAuth, logAdminAccess, AdminRequest } from '../middleware/adminAuth';
import { MonitoringService } from '../services/MonitoringService';
import { UsageTracker } from '../middleware/usageTracking';

const router = Router();
const monitoringService = new MonitoringService();

// Apply admin access logging to all admin routes
router.use(logAdminAccess);

// Admin login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const isValid = await AdminAuthService.verifyAdminCredentials(email, password);
    if (!isValid) {
      // Log failed login attempt
      console.log(`[ADMIN] Failed login attempt from ${req.ip} for email: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = AdminAuthService.generateAdminToken();

    // Log successful login
    console.log(`[ADMIN] Successful login from ${req.ip} for owner account`);

    res.json({
      success: true,
      token,
      expiresIn: '24h',
      role: 'owner'
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current usage statistics
router.get('/monitoring/stats', requireAdminAuth, async (req: AdminRequest, res: Response) => {
  try {
    const stats = await monitoringService.getCurrentUsageStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching usage stats:', error);
    res.status(500).json({ error: 'Failed to fetch usage statistics' });
  }
});

// Get cost breakdown
router.get('/monitoring/costs', requireAdminAuth, async (req: AdminRequest, res: Response) => {
  try {
    const costBreakdown = await monitoringService.getCostBreakdown();
    res.json(costBreakdown);
  } catch (error) {
    console.error('Error fetching cost breakdown:', error);
    res.status(500).json({ error: 'Failed to fetch cost breakdown' });
  }
});

// Get usage history
router.get('/monitoring/history', requireAdminAuth, async (req: AdminRequest, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    if (days > 365) {
      return res.status(400).json({ error: 'Maximum history period is 365 days' });
    }

    const history = await monitoringService.getUsageHistory(days);
    res.json(history);
  } catch (error) {
    console.error('Error fetching usage history:', error);
    res.status(500).json({ error: 'Failed to fetch usage history' });
  }
});

// Get detailed API logs
router.get('/monitoring/logs', requireAdminAuth, async (req: AdminRequest, res: Response) => {
  try {
    const {
      service,
      limit = 100,
      offset = 0,
      startDate,
      endDate
    } = req.query;

    let query = `
      SELECT *
      FROM api_call_logs
      WHERE 1=1
    `;
    const params: any[] = [];

    if (service) {
      query += ` AND service = $${params.length + 1}`;
      params.push(service);
    }

    if (startDate) {
      query += ` AND timestamp >= $${params.length + 1}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND timestamp <= $${params.length + 1}`;
      params.push(endDate);
    }

    query += ` ORDER BY timestamp DESC`;
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await require('../config/database').database.query(query, params);

    res.json({
      logs: result.rows,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: result.rowCount
      }
    });
  } catch (error) {
    console.error('Error fetching API logs:', error);
    res.status(500).json({ error: 'Failed to fetch API logs' });
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
      const stats = await monitoringService.getCurrentUsageStats();
      const costs = await monitoringService.getCostBreakdown();

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

// Generate usage report
router.get('/monitoring/report', requireAdminAuth, async (req: AdminRequest, res: Response) => {
  try {
    const { format = 'json', period = 'monthly' } = req.query;

    const stats = await monitoringService.getCurrentUsageStats();
    const costs = await monitoringService.getCostBreakdown();
    const history = await monitoringService.getUsageHistory(
      period === 'weekly' ? 7 : period === 'daily' ? 1 : 30
    );

    const report = {
      generatedAt: new Date().toISOString(),
      period,
      summary: {
        totalMonthlyCost: costs.totalMonthlyCost,
        projectedMonthlyCost: costs.projectedMonthlyCost,
        totalApiCalls: stats.openai.totalCalls + stats.spotify.totalCalls + stats.youtube.totalCalls,
        alerts: costs.alerts
      },
      breakdown: costs.breakdown,
      usage: stats,
      history
    };

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertReportToCSV(report);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="usage-report-${period}.csv"`);
      res.send(csv);
    } else {
      res.json(report);
    }
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Update admin settings
router.put('/settings', requireAdminAuth, async (req: AdminRequest, res: Response) => {
  try {
    const { alertThresholds, notifications } = req.body;

    // In a real implementation, you would store these settings in the database
    // For now, we'll just acknowledge the update

    console.log(`[ADMIN] Settings updated by ${req.admin?.id}:`, { alertThresholds, notifications });

    res.json({
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Test monitoring endpoint (for debugging)
router.post('/monitoring/test', requireAdminAuth, async (req: AdminRequest, res: Response) => {
  try {
    // Create a test API call log
    UsageTracker.trackOpenAICall(
      '/test',
      'gpt-3.5-turbo',
      100,
      50,
      1000,
      200
    );

    res.json({
      success: true,
      message: 'Test API call logged successfully'
    });
  } catch (error) {
    console.error('Error creating test log:', error);
    res.status(500).json({ error: 'Failed to create test log' });
  }
});

// Helper function to convert report to CSV
function convertReportToCSV(report: any): string {
  const lines: string[] = [];

  // Header
  lines.push('Service,Calls,Cost,Tokens/Quota');

  // OpenAI
  lines.push(`OpenAI,${report.usage.openai.totalCalls},${report.usage.openai.totalCost},${report.usage.openai.totalTokens}`);

  // Spotify
  lines.push(`Spotify,${report.usage.spotify.totalCalls},0,${report.usage.spotify.dailyCalls}`);

  // YouTube
  lines.push(`YouTube,${report.usage.youtube.totalCalls},0,${report.usage.youtube.dailyQuotaUsed}`);

  return lines.join('\n');
}

export default router;