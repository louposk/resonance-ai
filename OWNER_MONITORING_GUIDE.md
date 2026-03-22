# 🎛️ Resonance AI Owner Monitoring System

## 🚀 **LIVE DASHBOARD ACCESS**
**URL:** https://resonance-ai-eight.vercel.app/admin

**Login Credentials:**
- **Email:** admin@resonance-ai.com
- **Password:** adminpassword123!

---

## 📊 **What You Can Monitor**

### 💰 **Real-Time Cost Tracking**
- **OpenAI GPT-4/3.5-turbo usage** with exact token counts and costs
- **Monthly cost projections** based on current usage trends
- **Daily spending alerts** when thresholds are exceeded

### 📈 **API Quota Monitoring**
- **Spotify API:** 2,000 requests/hour limit tracking
- **YouTube API:** 10,000 units/day quota monitoring
- **Real-time usage percentages** with visual progress bars

### ⚡ **Performance Metrics**
- **Database queries** and storage usage
- **Redis cache** hit rates and memory usage
- **API response times** and error rates

### 🚨 **Smart Alerts**
- **Cost warnings** at 50%, 80%, 95% of your budget
- **Quota alerts** when approaching API limits
- **Error rate notifications** for service issues

---

## 🔑 **API Access (for Automation)**

**Admin API Key:** admin-api-key-resonance-2024-secure-12345

**Usage Examples:**
```bash
# Get current usage stats
curl -H "x-admin-api-key: admin-api-key-resonance-2024-secure-12345" \
  https://resonance-ai-eight.vercel.app/api/admin/monitoring/stats

# Get cost breakdown
curl -H "x-admin-api-key: admin-api-key-resonance-2024-secure-12345" \
  https://resonance-ai-eight.vercel.app/api/admin/monitoring/costs

# Download usage report as CSV
curl -H "x-admin-api-key: admin-api-key-resonance-2024-secure-12345" \
  "https://resonance-ai-eight.vercel.app/api/admin/monitoring/report?format=csv" \
  -o usage-report.csv
```

---

## 💡 **Key Features**

### 🎯 **Real-Time Dashboard**
- **Live updates** every 30 seconds
- **Beautiful dark theme** matching your Resonance AI branding
- **Mobile-responsive** - monitor from anywhere
- **Visual progress bars** for quota tracking

### 📧 **Automated Alerts**
- **Email notifications** (configurable)
- **Webhook integration** support
- **Daily/weekly reports** via email
- **Cost projection warnings**

### 🔒 **Security**
- **Owner-only access** with secure authentication
- **Encrypted environment variables**
- **Session-based login** with JWT tokens
- **Admin access logging** for security

### 📊 **Analytics & Reports**
- **Historical usage patterns** (7, 30, 365 days)
- **CSV export** for spreadsheet analysis
- **Cost breakdown** by service
- **Usage trend analysis**

---

## 📋 **Current Alert Thresholds**

| Service | Warning Level | Threshold |
|---------|---------------|-----------|
| OpenAI Daily Cost | ⚠️ Warning | $5.00/day |
| OpenAI Monthly Cost | 🚨 Critical | $50.00/month |
| Spotify Hourly API | ⚠️ Warning | 1,600/2,000 calls |
| YouTube Daily API | ⚠️ Warning | 8,000/10,000 units |

*You can adjust these thresholds in the admin dashboard settings.*

---

## 🎛️ **Dashboard Sections**

### 1. **Monthly Cost Card**
- Current month spending
- Projected month-end cost
- Cost trend indicator

### 2. **OpenAI Usage Card**
- Total API calls this month
- Tokens consumed (input + output)
- GPT-4 vs GPT-3.5-turbo breakdown

### 3. **Spotify Quota Card**
- Hourly usage percentage
- Progress bar visualization
- Time until quota reset

### 4. **YouTube Quota Card**
- Daily quota usage percentage
- Units consumed vs available
- Midnight reset countdown

### 5. **Database & Redis Cards**
- Query count and storage usage
- Cache hit rates and performance
- Connection pool statistics

### 6. **Alerts Panel**
- Active warnings and notifications
- System health status
- Recent alert history

---

## 🚀 **Pro Tips**

1. **Check Daily:** Monitor costs daily to avoid surprises
2. **Set Budgets:** Use the threshold settings to control spending
3. **Optimize Usage:** Use the analytics to find expensive operations
4. **Monitor Peaks:** Track usage patterns during high-traffic periods
5. **Export Reports:** Download monthly CSV reports for accounting

---

## ⚙️ **Configuration**

All monitoring is automatically configured with your existing API keys:
- ✅ OpenAI API tracking enabled
- ✅ Spotify API monitoring active
- ✅ YouTube API quota tracking live
- ✅ Database usage logging operational
- ✅ Redis cache monitoring enabled

**No additional setup required!** 🎉

---

## 📞 **Need Changes?**

Want to modify alert thresholds, add new metrics, or integrate with other services? The monitoring system is fully extensible and can be customized to track any API or service you use.

**Happy Monitoring!** 📊✨