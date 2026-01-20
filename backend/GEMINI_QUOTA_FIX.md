# Gemini API Quota/Rate Limit Issues - Solutions

## Current Error
```
429 Too Many Requests - Quota exceeded
quota_limit_value: "0"
```

This indicates the Gemini API key has hit its rate limit or quota limit.

## Solutions

### Option 1: Wait and Retry (Immediate)
- The API has rate limits per minute
- Wait 1-2 minutes and try uploading again
- The document is still saved, just without AI analysis

### Option 2: Request Higher Quota (Recommended for Production)
1. Visit: https://cloud.google.com/docs/quotas/help/request_increase
2. Go to Google Cloud Console
3. Navigate to APIs & Services > Quotas
4. Find "Generative Language API"
5. Request quota increase for "GenerateContentRequestsPerMinutePerProjectPerRegion"

### Option 3: Use Different Model (Temporary Workaround)
The code now tries `gemini-1.5-flash` first, then falls back to `gemini-pro` if available.

### Option 4: Add Retry Logic with Exponential Backoff
We can add automatic retry logic to handle temporary rate limits.

### Option 5: Check API Key Status
1. Go to: https://makersuite.google.com/app/apikey
2. Verify your API key is active
3. Check if billing is enabled (some features require billing)

## Current Behavior
- ✅ Document is still saved to database
- ✅ File is stored on server
- ⚠️  AI analysis fails but shows user-friendly error message
- ✅ User can retry later or use document without AI summary

## Testing Without AI
The system gracefully degrades - documents are stored even if AI fails. You can:
1. Upload documents (they'll be saved)
2. View documents manually
3. Add manual summaries later if needed

## Next Steps
1. **Short term**: Wait 1-2 minutes and retry
2. **Medium term**: Request quota increase from Google Cloud
3. **Long term**: Consider implementing retry logic or alternative AI service

