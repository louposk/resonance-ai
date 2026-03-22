import { database } from '../config/database';

export interface Alert {
  id?: string;
  alert_type: 'cost_threshold' | 'quota_warning' | 'api_error' | 'rate_limit';
  threshold_value: number;
  current_value: number;
  message: string;
  is_resolved: boolean;
  created_at?: Date;
  resolved_at?: Date;
}

export interface AlertThresholds {
  openai_daily_cost: number;
  openai_monthly_cost: number;
  spotify_hourly_quota: number;
  youtube_daily_quota: number;
  api_error_rate: number;
}

export class AlertService {
  private static readonly DEFAULT_THRESHOLDS: AlertThresholds = {
    openai_daily_cost: 5.00, // $5 per day
    openai_monthly_cost: 50.00, // $50 per month
    spotify_hourly_quota: 1600, // 80% of 2000 hourly limit
    youtube_daily_quota: 8000, // 80% of 10000 daily quota
    api_error_rate: 10 // 10% error rate
  };

  static async initializeDefaultSettings(): Promise<void> {
    try {
      const existingSettings = await database.query(
        'SELECT * FROM admin_settings WHERE setting_key = $1',
        ['alert_thresholds']
      );

      if (existingSettings.rows.length === 0) {
        await database.query(
          'INSERT INTO admin_settings (setting_key, setting_value) VALUES ($1, $2)',
          ['alert_thresholds', JSON.stringify(this.DEFAULT_THRESHOLDS)]
        );
        console.log('✅ Default alert thresholds initialized');
      }
    } catch (error) {
      console.error('Failed to initialize alert settings:', error);
    }
  }

  static async getAlertThresholds(): Promise<AlertThresholds> {
    try {
      const result = await database.query(
        'SELECT setting_value FROM admin_settings WHERE setting_key = $1',
        ['alert_thresholds']
      );

      if (result.rows.length > 0) {
        return result.rows[0].setting_value;
      }

      return this.DEFAULT_THRESHOLDS;
    } catch (error) {
      console.error('Failed to get alert thresholds:', error);
      return this.DEFAULT_THRESHOLDS;
    }
  }

  static async updateAlertThresholds(thresholds: AlertThresholds): Promise<void> {
    try {
      await database.query(
        `INSERT INTO admin_settings (setting_key, setting_value)
         VALUES ($1, $2)
         ON CONFLICT (setting_key)
         DO UPDATE SET setting_value = $2, updated_at = CURRENT_TIMESTAMP`,
        ['alert_thresholds', JSON.stringify(thresholds)]
      );
      console.log('📊 Alert thresholds updated');
    } catch (error) {
      console.error('Failed to update alert thresholds:', error);
    }
  }

  static async createAlert(alert: Alert): Promise<void> {
    try {
      const query = `
        INSERT INTO cost_alerts (alert_type, threshold_value, current_value, message, is_resolved)
        VALUES ($1, $2, $3, $4, $5)
      `;

      await database.query(query, [
        alert.alert_type,
        alert.threshold_value,
        alert.current_value,
        alert.message,
        alert.is_resolved
      ]);

      console.log(`🚨 Alert created: ${alert.message}`);

      // Send notification (could be email, webhook, etc.)
      await this.sendNotification(alert);
    } catch (error) {
      console.error('Failed to create alert:', error);
    }
  }

  static async checkDailyCostAlert(dailyCost: number): Promise<void> {
    const thresholds = await this.getAlertThresholds();

    if (dailyCost > thresholds.openai_daily_cost) {
      // Check if alert already exists for today
      const today = new Date().toISOString().split('T')[0];
      const existingAlert = await database.query(
        `SELECT id FROM cost_alerts
         WHERE alert_type = 'cost_threshold'
         AND DATE(created_at) = $1
         AND is_resolved = false`,
        [today]
      );

      if (existingAlert.rows.length === 0) {
        await this.createAlert({
          alert_type: 'cost_threshold',
          threshold_value: thresholds.openai_daily_cost,
          current_value: dailyCost,
          message: `⚠️ Daily OpenAI cost exceeded threshold: $${dailyCost.toFixed(2)} > $${thresholds.openai_daily_cost.toFixed(2)}`,
          is_resolved: false
        });
      }
    }
  }

  static async checkMonthlyCostAlert(monthlyCost: number): Promise<void> {
    const thresholds = await this.getAlertThresholds();

    if (monthlyCost > thresholds.openai_monthly_cost) {
      const thisMonth = new Date().toISOString().substring(0, 7);
      const existingAlert = await database.query(
        `SELECT id FROM cost_alerts
         WHERE alert_type = 'cost_threshold'
         AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
         AND is_resolved = false`,
        []
      );

      if (existingAlert.rows.length === 0) {
        await this.createAlert({
          alert_type: 'cost_threshold',
          threshold_value: thresholds.openai_monthly_cost,
          current_value: monthlyCost,
          message: `🚨 Monthly OpenAI cost exceeded threshold: $${monthlyCost.toFixed(2)} > $${thresholds.openai_monthly_cost.toFixed(2)}`,
          is_resolved: false
        });
      }
    }
  }

  static async checkSpotifyQuotaAlert(hourlyCalls: number): Promise<void> {
    const thresholds = await this.getAlertThresholds();

    if (hourlyCalls > thresholds.spotify_hourly_quota) {
      const currentHour = new Date().getHours();
      const existingAlert = await database.query(
        `SELECT id FROM cost_alerts
         WHERE alert_type = 'quota_warning'
         AND EXTRACT(HOUR FROM created_at) = $1
         AND DATE(created_at) = CURRENT_DATE
         AND is_resolved = false`,
        [currentHour]
      );

      if (existingAlert.rows.length === 0) {
        await this.createAlert({
          alert_type: 'quota_warning',
          threshold_value: thresholds.spotify_hourly_quota,
          current_value: hourlyCalls,
          message: `⚠️ Spotify API approaching hourly limit: ${hourlyCalls} > ${thresholds.spotify_hourly_quota} calls`,
          is_resolved: false
        });
      }
    }
  }

  static async checkYouTubeQuotaAlert(dailyQuotaUsed: number): Promise<void> {
    const thresholds = await this.getAlertThresholds();

    if (dailyQuotaUsed > thresholds.youtube_daily_quota) {
      const today = new Date().toISOString().split('T')[0];
      const existingAlert = await database.query(
        `SELECT id FROM cost_alerts
         WHERE alert_type = 'quota_warning'
         AND DATE(created_at) = $1
         AND is_resolved = false`,
        [today]
      );

      if (existingAlert.rows.length === 0) {
        await this.createAlert({
          alert_type: 'quota_warning',
          threshold_value: thresholds.youtube_daily_quota,
          current_value: dailyQuotaUsed,
          message: `⚠️ YouTube API approaching daily quota: ${dailyQuotaUsed} > ${thresholds.youtube_daily_quota} units`,
          is_resolved: false
        });
      }
    }
  }

  static async checkApiErrorRateAlert(service: string, errorRate: number): Promise<void> {
    const thresholds = await this.getAlertThresholds();

    if (errorRate > thresholds.api_error_rate) {
      const existingAlert = await database.query(
        `SELECT id FROM cost_alerts
         WHERE alert_type = 'api_error'
         AND message LIKE $1
         AND DATE(created_at) = CURRENT_DATE
         AND is_resolved = false`,
        [`%${service}%`]
      );

      if (existingAlert.rows.length === 0) {
        await this.createAlert({
          alert_type: 'api_error',
          threshold_value: thresholds.api_error_rate,
          current_value: errorRate,
          message: `🚨 High error rate detected for ${service}: ${errorRate.toFixed(1)}%`,
          is_resolved: false
        });
      }
    }
  }

  static async getActiveAlerts(): Promise<Alert[]> {
    try {
      const result = await database.query(
        `SELECT * FROM cost_alerts
         WHERE is_resolved = false
         ORDER BY created_at DESC
         LIMIT 10`
      );

      return result.rows;
    } catch (error) {
      console.error('Failed to get active alerts:', error);
      return [];
    }
  }

  static async resolveAlert(alertId: string): Promise<void> {
    try {
      await database.query(
        `UPDATE cost_alerts
         SET is_resolved = true, resolved_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [alertId]
      );
      console.log(`✅ Alert resolved: ${alertId}`);
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  }

  private static async sendNotification(alert: Alert): Promise<void> {
    // In a real implementation, you would send email, Slack notification, etc.
    // For now, we'll just log to console
    console.log(`📧 [NOTIFICATION] ${alert.message}`);

    // Example of sending webhook notification:
    /*
    const webhookUrl = process.env.ALERT_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await axios.post(webhookUrl, {
          text: alert.message,
          channel: '#alerts',
          username: 'Resonance AI Monitor'
        });
      } catch (error) {
        console.error('Failed to send webhook notification:', error);
      }
    }
    */

    // Example of sending email:
    /*
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      // Use nodemailer or other email service
      // await sendEmail({
      //   to: adminEmail,
      //   subject: `Resonance AI Alert: ${alert.alert_type}`,
      //   text: alert.message
      // });
    }
    */
  }

  static async generateDailyReport(): Promise<string> {
    const today = new Date().toISOString().split('T')[0];

    const dailyStats = await database.query(`
      SELECT
        service,
        COUNT(*) as total_calls,
        SUM(COALESCE(tokens_used, 0)) as total_tokens,
        SUM(COALESCE(cost_usd, 0)) as total_cost,
        AVG(response_time_ms) as avg_response_time
      FROM api_call_logs
      WHERE DATE(timestamp) = $1
      GROUP BY service
    `, [today]);

    const alerts = await database.query(`
      SELECT alert_type, message, created_at
      FROM cost_alerts
      WHERE DATE(created_at) = $1
      ORDER BY created_at DESC
    `, [today]);

    let report = `📊 Resonance AI Daily Report - ${today}\n\n`;

    report += `📈 API Usage:\n`;
    for (const stat of dailyStats.rows) {
      report += `  ${stat.service}: ${stat.total_calls} calls`;
      if (stat.total_cost > 0) {
        report += `, $${parseFloat(stat.total_cost).toFixed(4)} cost`;
      }
      if (stat.total_tokens > 0) {
        report += `, ${stat.total_tokens} tokens`;
      }
      report += `\n`;
    }

    if (alerts.rows.length > 0) {
      report += `\n🚨 Alerts:\n`;
      for (const alert of alerts.rows) {
        report += `  ${alert.alert_type}: ${alert.message}\n`;
      }
    } else {
      report += `\n✅ No alerts today - all systems operational\n`;
    }

    return report;
  }
}