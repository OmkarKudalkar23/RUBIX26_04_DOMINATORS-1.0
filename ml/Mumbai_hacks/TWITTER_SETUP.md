# Twitter API Setup Guide
# Free tier: 500,000 tweets/month - Perfect for disease monitoring

## 🚀 Step 1: Get Twitter API Credentials

1. **Apply for Twitter Developer Account**
   - Go to: https://developer.twitter.com/en/portal/dashboard
   - Sign up with your Twitter account
   - Apply for "Essential" access (free tier)

2. **Create New App**
   - Click "Create Project" → "Create App"
   - App name: "Disease Early Warning System"
   - Use case: "Academic Research" or "Health Monitoring"
   - Description: "Real-time disease surveillance using social media data"

3. **Get API Keys**
   - Go to your App dashboard
   - Click "Keys and tokens" tab
   - Generate API Key and Secret
   - Generate Access Token and Secret

## 🔧 Step 2: Configure Environment Variables

Add to your `.env` file:

```bash
# Twitter API Credentials (Free tier - 500K tweets/month)
TWITTER_API_KEY=your_api_key_here
TWITTER_API_SECRET=your_api_secret_here
TWITTER_ACCESS_TOKEN=your_access_token_here
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret_here
```

## 📊 Step 3: How It Works in Your System

### **Data Collection Strategy**
```python
# Combined approach: 70% Google Trends + 30% Twitter
combined_trends = {
    "fever": google_trends["fever"] * 0.7 + twitter_trends["fever"] * 0.3,
    "cough": google_trends["cough"] * 0.7 + twitter_trends["cough"] * 0.3,
    "dengue": google_trends["dengue"] * 0.7 + twitter_trends["dengue"] * 0.3,
    "flu": google_trends["flu"] * 0.7 + twitter_trends["flu"] * 0.3
}
```

### **Twitter Search Query**
```
"fever OR cough OR dengue OR flu -filter:retweets lang:en"
```
- Searches for symptom mentions in English
- Excludes retweets (to avoid duplicates)
- Limits to recent tweets

### **Data Processing**
- Counts unique symptom mentions per tweet
- Avoids double-counting if multiple symptoms mentioned
- Real-time collection (last 100 tweets)

## 📈 Benefits of Combined Approach

### **Google Trends (70% weight)**
- ✅ No API key required
- ✅ Reliable search volume data
- ✅ Historical trend analysis
- ✅ Geographic filtering

### **Twitter API (30% weight)**
- ✅ Real-time social media mentions
- ✅ Actual patient/user reports
- ✅ Early outbreak signals
- ✅ Free tier: 500K tweets/month

## 🧪 Step 4: Test Twitter Integration

```python
# Test script
import os
from ep.early_signals import EarlySignalCollector

# Set your Twitter credentials in .env first
collector = EarlySignalCollector()

# Test combined trends
trends = collector._collect_search_trends("Mumbai", datetime.now())
print("Combined Trends:", trends)

# Test Twitter only
if collector.twitter_api:
    twitter_trends = collector._fetch_twitter_trends("Mumbai")
    print("Twitter Trends:", twitter_trends)
else:
    print("Twitter API not configured")
```

## 🔄 Step 5: Run Full System

```bash
# Install dependencies
pip install tweepy>=4.14.0

# Test the real data system
python test_real_data.py

# Start the early warning system
cd ep
python early_warning_workflow.py
```

## 📊 Usage Limits & Monitoring

### **Twitter Free Tier Limits**
- **500,000 tweets/month** (~16,000 tweets/day)
- **300 requests/3-hours** for search
- **Rate limiting** automatically handled

### **Monitoring Usage**
```python
# The system automatically handles rate limits
api = tweepy.API(auth, wait_on_rate_limit=True)

# Logs show collection status
logger.info("✅ Twitter trends data collected for Mumbai")
logger.warning("Twitter unavailable: Rate limit exceeded")
```

## 🚨 Troubleshooting

### **Common Issues**

#### "Twitter API credentials not found"
```bash
# Check .env file exists and has credentials
cat .env | grep TWITTER
```

#### "Rate limit exceeded"
- ✅ Automatically handled with `wait_on_rate_limit=True`
- ✅ System falls back to Google Trends only
- ✅ Logs warning but continues working

#### "Invalid credentials"
- Verify API keys in Twitter Developer Portal
- Ensure app has "Read" permissions
- Regenerate keys if needed

### **Fallback Behavior**
```python
# If Twitter fails, system uses Google Trends only
if not self.twitter_api:
    logger.info("ℹ️ Using Google Trends only - Twitter not configured")
    return google_trends  # 100% Google Trends
```

## 📈 Expected Data Output

### **Combined Trends Example**
```json
{
  "fever": 45.2,    // Google: 50 + Twitter: 15 * 0.3
  "cough": 38.7,    // Google: 40 + Twitter: 29 * 0.3  
  "dengue": 12.1,   // Google: 10 + Twitter: 7 * 0.3
  "flu": 25.3       // Google: 25 + Twitter: 1 * 0.3
}
```

### **Twitter-only Example**
```json
{
  "fever": 15,      // 15 tweets mentioning fever
  "cough": 29,      // 29 tweets mentioning cough
  "dengue": 7,      // 7 tweets mentioning dengue
  "flu": 1          // 1 tweet mentioning flu
}
```

## 🎯 Best Practices

### **Optimal Search Strategy**
- Use specific symptoms vs general terms
- Exclude retweets to avoid duplicates
- Limit to English for consistent analysis
- Use geographic filters when possible

### **Data Quality**
- Cross-reference with Google Trends
- Monitor for spam/automated tweets
- Validate against official health data
- Adjust weights based on accuracy

## ✅ Setup Complete

Once configured, your system will:
1. **Collect Google Trends data** (no API key needed)
2. **Collect Twitter data** (if credentials provided)
3. **Combine both sources** with optimal weighting
4. **Provide fallback** if one source fails
5. **Log all activities** for monitoring

**Result**: Comprehensive, real-time disease trend monitoring using both search and social media data!
