# Deployment Checklist

## Pre-Deployment Verification

### ✅ Backend (Python)

- [ ] All dependencies installed: `pip install -r requirements.txt`
- [ ] API runs without errors: `python api.py`
- [ ] API accessible at `http://localhost:8000`
- [ ] Swagger docs available at `http://localhost:8000/docs`
- [ ] All endpoints respond correctly
- [ ] CORS enabled for frontend domain
- [ ] Environment variables configured
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] Database/CSV logging working

### ✅ Frontend (Next.js)

- [ ] All dependencies installed: `npm install`
- [ ] Development server runs: `npm run dev`
- [ ] Frontend accessible at `http://localhost:3000`
- [ ] All three dashboards load correctly
- [ ] Location detection working
- [ ] API calls successful
- [ ] No console errors
- [ ] Responsive design verified
- [ ] All links working
- [ ] Environment variables set in `.env.local`

### ✅ Integration Testing

- [ ] Patient dashboard displays correctly
- [ ] Doctor dashboard displays correctly
- [ ] Hospital dashboard displays correctly
- [ ] Location permission request appears
- [ ] Data loads after permission granted
- [ ] Refresh button works
- [ ] Back navigation works
- [ ] All AQI levels display correctly
- [ ] Recommendations display correctly
- [ ] Timestamps are accurate

---

## Backend Deployment

### Option 1: Deploy to Heroku

```bash
# 1. Create Heroku app
heroku create your-app-name

# 2. Set environment variables
heroku config:set PYTHONUNBUFFERED=1

# 3. Deploy
git push heroku main

# 4. Verify
heroku logs --tail
heroku open
```

**Checklist:**
- [ ] Heroku account created
- [ ] Heroku CLI installed
- [ ] Git repository initialized
- [ ] Procfile created (if needed)
- [ ] Environment variables set
- [ ] Deployment successful
- [ ] API responding on Heroku URL

### Option 2: Deploy to AWS EC2

```bash
# 1. Create EC2 instance (Ubuntu 20.04)
# 2. SSH into instance
ssh -i key.pem ubuntu@your-instance-ip

# 3. Install dependencies
sudo apt update
sudo apt install python3-pip python3-venv

# 4. Clone repository
git clone your-repo-url
cd WeatherAgent

# 5. Create virtual environment
python3 -m venv venv
source venv/bin/activate

# 6. Install Python dependencies
pip install -r requirements.txt

# 7. Run with gunicorn
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 api:app

# 8. Setup systemd service (optional)
sudo nano /etc/systemd/system/weatheragent.service
```

**Checklist:**
- [ ] EC2 instance created
- [ ] Security group configured
- [ ] SSH access verified
- [ ] Python installed
- [ ] Dependencies installed
- [ ] API running on port 8000
- [ ] Domain/IP accessible
- [ ] SSL certificate configured

### Option 3: Deploy with Docker

```bash
# 1. Create Dockerfile
# 2. Build image
docker build -t weatheragent .

# 3. Run container
docker run -p 8000:8000 weatheragent

# 4. Push to Docker Hub (optional)
docker tag weatheragent your-username/weatheragent
docker push your-username/weatheragent
```

**Checklist:**
- [ ] Docker installed
- [ ] Dockerfile created
- [ ] Image builds successfully
- [ ] Container runs without errors
- [ ] API accessible from container
- [ ] Environment variables passed correctly
- [ ] Ports mapped correctly

---

## Frontend Deployment

### Option 1: Deploy to Netlify

```bash
# 1. Connect GitHub repository to Netlify
# 2. Configure build settings:
#    Build command: npm run build
#    Publish directory: .next
# 3. Add environment variables:
#    NEXT_PUBLIC_API_URL=https://your-api-url.com
# 4. Deploy
```

**Checklist:**
- [ ] GitHub account connected
- [ ] Repository pushed to GitHub
- [ ] Netlify account created
- [ ] Repository connected to Netlify
- [ ] Build settings configured
- [ ] Environment variables set
- [ ] Build successful
- [ ] Site accessible
- [ ] API calls working
- [ ] Custom domain configured (optional)

### Option 2: Deploy to Vercel

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy
cd frontend
vercel

# 3. Configure environment variables in Vercel dashboard
# 4. Set NEXT_PUBLIC_API_URL
```

**Checklist:**
- [ ] Vercel account created
- [ ] Vercel CLI installed
- [ ] GitHub connected to Vercel
- [ ] Deployment successful
- [ ] Environment variables set
- [ ] Site accessible
- [ ] API calls working
- [ ] Custom domain configured (optional)

### Option 3: Deploy to AWS S3 + CloudFront

```bash
# 1. Build Next.js app
npm run build

# 2. Export static site (if using static export)
npm run export

# 3. Upload to S3
aws s3 sync out/ s3://your-bucket-name

# 4. Configure CloudFront distribution
# 5. Set custom domain
```

**Checklist:**
- [ ] AWS account created
- [ ] S3 bucket created
- [ ] CloudFront distribution created
- [ ] Build successful
- [ ] Files uploaded to S3
- [ ] CloudFront configured
- [ ] Custom domain set
- [ ] SSL certificate configured

---

## Post-Deployment Verification

### ✅ Backend Verification

```bash
# Test API endpoint
curl https://your-api-url.com/predict/Mumbai

# Check API documentation
https://your-api-url.com/docs

# Test all endpoints
curl https://your-api-url.com/cities
curl https://your-api-url.com/
```

**Checklist:**
- [ ] API accessible from internet
- [ ] All endpoints responding
- [ ] Swagger docs available
- [ ] CORS headers present
- [ ] Error handling working
- [ ] Logging working
- [ ] Database/CSV logging working
- [ ] Performance acceptable

### ✅ Frontend Verification

```bash
# Visit deployed site
https://your-frontend-url.com

# Test all dashboards
https://your-frontend-url.com/patient
https://your-frontend-url.com/doctor
https://your-frontend-url.com/hospital
```

**Checklist:**
- [ ] Site accessible from internet
- [ ] All pages load correctly
- [ ] Location detection working
- [ ] API calls successful
- [ ] Data displays correctly
- [ ] Responsive design working
- [ ] No console errors
- [ ] Performance acceptable
- [ ] All links working

### ✅ Integration Verification

- [ ] Frontend connects to backend API
- [ ] Data flows correctly
- [ ] All dashboards display data
- [ ] Refresh functionality works
- [ ] Error messages display correctly
- [ ] Loading states show correctly
- [ ] Navigation works correctly
- [ ] Mobile responsiveness verified

---

## Performance Optimization

### Backend Optimization

- [ ] Enable caching
- [ ] Implement rate limiting
- [ ] Optimize database queries
- [ ] Enable gzip compression
- [ ] Monitor API response times
- [ ] Set up monitoring/alerts

### Frontend Optimization

- [ ] Build size acceptable
- [ ] Images optimized
- [ ] CSS minified
- [ ] JavaScript minified
- [ ] Code splitting working
- [ ] Lazy loading implemented
- [ ] Core Web Vitals good
- [ ] Lighthouse score > 90

---

## Security Checklist

### Backend Security

- [ ] No hardcoded secrets
- [ ] Environment variables used
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Input validation implemented
- [ ] Rate limiting enabled
- [ ] Error messages don't expose internals
- [ ] Logging doesn't contain sensitive data
- [ ] Dependencies up to date
- [ ] Security headers configured

### Frontend Security

- [ ] No API keys in code
- [ ] Environment variables used
- [ ] HTTPS enforced
- [ ] Content Security Policy set
- [ ] Dependencies up to date
- [ ] No console errors
- [ ] XSS protection enabled
- [ ] CSRF protection if needed

---

## Monitoring & Maintenance

### Set Up Monitoring

- [ ] Error tracking (Sentry, etc.)
- [ ] Performance monitoring (New Relic, etc.)
- [ ] Uptime monitoring (UptimeRobot, etc.)
- [ ] Log aggregation (CloudWatch, etc.)
- [ ] Alerts configured
- [ ] Dashboard created

### Regular Maintenance

- [ ] Weekly: Check logs and errors
- [ ] Weekly: Monitor performance
- [ ] Monthly: Update dependencies
- [ ] Monthly: Review security
- [ ] Quarterly: Full system audit
- [ ] Quarterly: Backup verification

---

## Rollback Plan

### If Deployment Fails

1. **Identify Issue**
   - [ ] Check logs
   - [ ] Check error messages
   - [ ] Verify environment variables
   - [ ] Test locally first

2. **Rollback**
   - [ ] Revert to previous version
   - [ ] Verify previous version works
   - [ ] Notify users if needed

3. **Fix and Redeploy**
   - [ ] Fix identified issue
   - [ ] Test thoroughly
   - [ ] Deploy again

---

## Final Checklist

### Before Going Live

- [ ] All tests passing
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] Deployment plan documented
- [ ] Rollback plan ready
- [ ] Team trained
- [ ] Monitoring set up
- [ ] Backup verified
- [ ] Security audit passed
- [ ] Performance acceptable

### Launch Day

- [ ] Final verification complete
- [ ] Team on standby
- [ ] Monitoring active
- [ ] Support team ready
- [ ] Communication plan ready
- [ ] Deploy to production
- [ ] Verify deployment
- [ ] Monitor closely for 24 hours

### Post-Launch

- [ ] Monitor for issues
- [ ] Gather user feedback
- [ ] Fix any critical issues
- [ ] Document lessons learned
- [ ] Plan next improvements

---

## Deployment Status

| Component | Status | URL | Date |
|-----------|--------|-----|------|
| Backend API | ⏳ Pending | - | - |
| Frontend | ⏳ Pending | - | - |
| Database | ⏳ Pending | - | - |
| Monitoring | ⏳ Pending | - | - |

---

## Notes

- Update this checklist as you deploy
- Keep track of deployment dates
- Document any issues encountered
- Update URLs once deployed
- Share this checklist with team

---

**Last Updated**: November 18, 2025
**Deployment Status**: Ready for Deployment
