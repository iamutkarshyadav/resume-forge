# Resume Forge - Deployment Checklist

**Target:** Production Deployment  
**Version:** 1.0.0  
**Date:** December 2024

---

## 1. PRE-DEPLOYMENT SETUP (Week Before)

### 1.1 Infrastructure Setup
- [ ] Provision production MongoDB cluster
  - [ ] Enable authentication (username/password)
  - [ ] Enable backups (daily, 30-day retention)
  - [ ] Enable monitoring and alerts
  - [ ] Test connection string from your server

- [ ] Provision Node.js server
  - [ ] Min 2GB RAM, 2 CPU cores
  - [ ] Ubuntu 20.04 LTS or similar
  - [ ] Node.js 18+ installed
  - [ ] npm or yarn installed

- [ ] Provision frontend hosting
  - [ ] Vercel (recommended for Next.js) OR
  - [ ] AWS S3 + CloudFront OR
  - [ ] Your own server

- [ ] SSL/TLS Certificates
  - [ ] Purchase or generate certificates
  - [ ] Install on server
  - [ ] Auto-renewal configured

### 1.2 Generate Secrets & Credentials
```bash
# Generate strong JWT secrets (use a password generator)
# Requirements: 32+ characters, random, alphanumeric + symbols

JWT_ACCESS_SECRET="$(openssl rand -base64 32)"     # Copy this
JWT_REFRESH_SECRET="$(openssl rand -base64 32)"    # Copy this

# Store safely in password manager:
# - JWT_ACCESS_TOKEN_SECRET
# - JWT_REFRESH_TOKEN_SECRET
# - DATABASE_URL
# - GEMINI_API_KEY (if using)
# - OAuth credentials (Google, GitHub if using)
```

### 1.3 Prepare Configuration Files
- [ ] Create `.env.production` locally (never commit)
- [ ] Create `.env.example` in repo (for documentation)
- [ ] Document all required environment variables
- [ ] Test configuration locally with `NODE_ENV=production`

---

## 2. BACKEND DEPLOYMENT

### 2.1 Prepare Backend
```bash
cd backend

# Verify build
npm run build

# Check for errors
npm run lint

# Ensure no console.log in production code
grep -r "console\." src/
```

- [ ] All compilation passes without errors
- [ ] No TypeScript errors
- [ ] No eslint violations

### 2.2 Deploy Backend Code
```bash
# Option A: Using Docker
docker build -t resume-forge-backend:1.0.0 .
docker push <registry>/resume-forge-backend:1.0.0

# Option B: Direct deployment
git clone <repo> /opt/resume-forge/
cd /opt/resume-forge/backend
npm ci --omit=dev
npm run build
```

- [ ] Code deployed to server
- [ ] No build errors
- [ ] Dependencies installed (`npm ci`, not `npm install`)

### 2.3 Set Environment Variables
```bash
# On production server, create /opt/resume-forge/backend/.env:
NODE_ENV=production
PORT=4000
BASE_URL=https://api.yourdomain.com
DATABASE_URL=mongodb+srv://...
JWT_ACCESS_TOKEN_SECRET=<32+ char secret>
JWT_REFRESH_TOKEN_SECRET=<32+ char secret>
JWT_ACCESS_TOKEN_EXPIRES_IN=15m
JWT_REFRESH_TOKEN_EXPIRES_IN=30d
UPLOAD_DIR=/opt/resume-forge/uploads
MAX_FILE_SIZE=5242880
GEMINI_API_KEY=<your key>
GEMINI_MODEL=gemini-2.5-flash
NODE_ENV=production
```

- [ ] `.env` file created on server
- [ ] File permissions restricted: `chmod 600 .env`
- [ ] No `.env` file in git repository
- [ ] All required variables present

### 2.4 Database Setup
```bash
# Test connection
NODE_ENV=production node -e "
  require('dotenv').config();
  const prisma = require('@prisma/client');
  console.log('DB Connected:', !!prisma);
"

# Create database schema
NODE_ENV=production npx prisma db push

# Verify schema
NODE_ENV=production npx prisma studio  # Optional: browse schema
```

- [ ] Database connection successful
- [ ] Schema created in production database
- [ ] No errors during migration

### 2.5 Start Backend Service
```bash
# Using PM2 (recommended)
npm install -g pm2
pm2 start "npm run start" --name "resume-forge-api" --env production
pm2 save
pm2 startup
pm2 status

# Or using systemd
sudo vi /etc/systemd/system/resume-forge-api.service
# [Unit]
# Description=Resume Forge Backend
# After=network.target
# [Service]
# WorkingDirectory=/opt/resume-forge/backend
# ExecStart=/usr/bin/npm run start
# Restart=always
# Environment="NODE_ENV=production"
# EnvironmentFile=/opt/resume-forge/backend/.env
# [Install]
# WantedBy=multi-user.target

sudo systemctl daemon-reload
sudo systemctl enable resume-forge-api
sudo systemctl start resume-forge-api
sudo systemctl status resume-forge-api
```

- [ ] Backend service running
- [ ] Health check: `curl http://localhost:4000/api/v1/health`
- [ ] Response: `{ "ok": true, "env": "production" }`

### 2.6 Setup Reverse Proxy
```bash
# Using nginx
sudo vi /etc/nginx/sites-available/resume-forge

# Add:
server {
  server_name api.yourdomain.com;
  listen 443 ssl http2;
  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;
  
  location / {
    proxy_pass http://localhost:4000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_redirect off;
  }
}

server {
  server_name api.yourdomain.com;
  listen 80;
  return 301 https://$server_name$request_uri;
}

sudo nginx -t
sudo systemctl reload nginx
```

- [ ] Nginx configured
- [ ] SSL certificate installed
- [ ] HTTP → HTTPS redirect working
- [ ] Backend accessible at `https://api.yourdomain.com/api/v1/health`

---

## 3. FRONTEND DEPLOYMENT

### 3.1 Prepare Frontend
```bash
cd frontend

# Set production environment
export NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com
export NEXT_PUBLIC_API_VERSION=v1

# Build
npm run build

# Verify build
npm run lint

# Size check
du -sh .next/
```

- [ ] Build succeeds without errors
- [ ] Bundle size acceptable (< 500KB gzipped)
- [ ] No TypeScript errors

### 3.2 Deploy Frontend (Option A: Vercel - Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod

# Configure environment in Vercel dashboard:
# NEXT_PUBLIC_API_BASE_URL = https://api.yourdomain.com
# NEXT_PUBLIC_API_VERSION = v1
```

- [ ] Project linked to Vercel
- [ ] Environment variables configured
- [ ] Build and deployment successful
- [ ] Domain configured (if using custom domain)

### 3.3 Deploy Frontend (Option B: Self-Hosted)
```bash
# Build
npm run build

# Copy to web server
scp -r .next build package.json server:/opt/resume-forge/frontend/

# On server:
cd /opt/resume-forge/frontend
npm ci --omit=dev
npm start
```

- [ ] Build output copied to server
- [ ] Dependencies installed
- [ ] Next.js server running on port 3000

### 3.4 Configure Frontend Reverse Proxy
```bash
# Update nginx for frontend
server {
  server_name app.yourdomain.com;  # or yourdomain.com
  listen 443 ssl http2;
  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;
  
  location / {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}

sudo nginx -t && sudo systemctl reload nginx
```

- [ ] Frontend accessible at configured domain
- [ ] HTTPS working
- [ ] API calls succeeding

---

## 4. SECURITY HARDENING

### 4.1 Backend Security
- [ ] `NODE_ENV=production` set
- [ ] Secrets are strong (32+ characters)
- [ ] No dev secrets in production
- [ ] File permissions restricted:
  ```bash
  chmod 600 /opt/resume-forge/backend/.env
  chmod 700 /opt/resume-forge/uploads
  ```
- [ ] CORS configured to specific domain (not `*`)
- [ ] Rate limiting active
- [ ] Helmet security headers enabled

### 4.2 Frontend Security
- [ ] All hardcoded URLs removed
- [ ] Environment variables injected at build time
- [ ] Source maps disabled
  ```bash
  # Check nextjs build output doesn't include .map files
  find .next -name "*.map" | wc -l  # Should be 0
  ```
- [ ] Content Security Policy headers configured

### 4.3 Infrastructure Security
- [ ] Firewall configured (only port 80, 443 open)
- [ ] SSH key-only access (no passwords)
- [ ] Fail2ban installed for brute-force protection
- [ ] Automatic security updates enabled
- [ ] Backups configured and tested
- [ ] Monitoring and alerting configured

### 4.4 Database Security
- [ ] Authentication enabled
- [ ] IP whitelist configured (only app server)
- [ ] Encryption at rest enabled
- [ ] Backups tested and encrypted
- [ ] No default credentials

---

## 5. TESTING & VALIDATION

### 5.1 API Testing
```bash
# Health check
curl https://api.yourdomain.com/api/v1/health
# Expected: { "ok": true, "env": "production" }

# User registration
curl -X POST https://api.yourdomain.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "firstname": "Test",
    "lastname": "User"
  }'

# Login
curl -X POST https://api.yourdomain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

- [ ] Health check returns success
- [ ] User registration works
- [ ] Login returns access token
- [ ] API errors return proper HTTP status codes

### 5.2 Frontend Testing
- [ ] Home page loads without errors
- [ ] Navigation works
- [ ] Dashboard displays (after login)
- [ ] Resume upload works
- [ ] Analysis completes successfully
- [ ] Error messages display properly
- [ ] Plan limits enforced
- [ ] Download functionality works

### 5.3 Security Testing
- [ ] User A cannot access User B's data
  ```bash
  # Login as User A, get User B's resume ID
  # Try to access it: should get 403 Forbidden
  curl -H "Authorization: Bearer <UserA_Token>" \
    https://api.yourdomain.com/api/v1/trpc/resume.get?resumeId=<UserB_ID>
  ```
- [ ] CSRF tokens validated (if applicable)
- [ ] File upload validates file types
- [ ] File upload limits enforced
- [ ] SQL injection impossible (Prisma ORM)
- [ ] XSS protections working

### 5.4 Performance Testing
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms
- [ ] Analysis completes in reasonable time
- [ ] Database queries optimized (no N+1)
- [ ] No memory leaks (monitor for 1 hour)

---

## 6. MONITORING & LOGGING

### 6.1 Setup Error Tracking
```bash
# Create Sentry account at sentry.io
# Get DSN and add to backend:
# SENTRY_DSN=https://...
```

- [ ] Sentry configured
- [ ] Backend errors logged
- [ ] Frontend errors logged
- [ ] Alerts configured

### 6.2 Setup Application Monitoring
```bash
# Option: PM2 monitoring
pm2 web  # Enables PM2 web dashboard

# Option: CloudWatch / DataDog
# Follow service-specific documentation
```

- [ ] CPU/Memory monitoring active
- [ ] Uptime monitoring configured
- [ ] Alerts configured

### 6.3 Setup Log Aggregation
```bash
# Option: PM2 logs
pm2 logs resume-forge-api

# Option: ELK Stack / LogRocket
# Follow service documentation
```

- [ ] Logs centralized and searchable
- [ ] Log retention configured (30 days minimum)
- [ ] Log alerts for errors configured

### 6.4 Setup Uptime Monitoring
- [ ] Uptime robot or equivalent monitoring homepage
- [ ] Alerts configured for downtime
- [ ] Status page created (optional)

---

## 7. POST-DEPLOYMENT (First 24 Hours)

### 7.1 Monitor Closely
- [ ] Check error logs every hour
- [ ] Monitor CPU/Memory usage
- [ ] Verify database connections stable
- [ ] Check API response times
- [ ] Monitor user signups and logins

### 7.2 Quick Response Team
- [ ] Team member on-call for 24 hours
- [ ] Incident response procedure defined
- [ ] Rollback plan prepared
- [ ] Communication channels ready

### 7.3 First Week Monitoring
- [ ] Daily review of error logs
- [ ] Weekly performance review
- [ ] User feedback monitoring
- [ ] Database performance analysis

---

## 8. ROLLBACK PROCEDURE

If critical issues arise post-deployment:

```bash
# Stop current version
pm2 stop resume-forge-api

# Checkout previous version
git checkout <previous_tag>

# Rebuild
npm run build

# Restart
pm2 start "npm run start" --name "resume-forge-api"

# Notify users
# Investigate issue
# Create hotfix
# Deploy again
```

---

## 9. DOMAIN CONFIGURATION

### 9.1 DNS Records
```
Type    | Name              | Value
--------|-------------------|------------------
A       | yourdomain.com    | <server_ip>
A       | api.yourdomain.com| <server_ip> or <api_server_ip>
A       | app.yourdomain.com| <server_ip> (if self-hosted)
CNAME   | www               | yourdomain.com
```

- [ ] DNS records created and propagated
- [ ] SSL certificates valid for all domains
- [ ] www redirect configured

### 9.2 Email Configuration (Optional)
- [ ] Email provider configured (SendGrid, AWS SES, etc.)
- [ ] Transactional emails tested
- [ ] SPF/DKIM/DMARC records configured

---

## 10. FINAL CHECKLIST

### Backend
- [ ] Deployed and running
- [ ] All environment variables set
- [ ] Database connected and schema created
- [ ] Health check passing
- [ ] API responding to requests
- [ ] Error logging working
- [ ] Rate limiting active

### Frontend
- [ ] Built and deployed
- [ ] Environment variables resolved
- [ ] API communication working
- [ ] All pages loading
- [ ] Forms submitting correctly
- [ ] Error handling working

### Infrastructure
- [ ] SSL certificates installed
- [ ] Firewall configured
- [ ] Reverse proxy working
- [ ] Backups configured
- [ ] Monitoring active
- [ ] Logging working
- [ ] Security hardened

### Documentation
- [ ] Runbook created
- [ ] Emergency procedures documented
- [ ] Team trained on deployment
- [ ] Incident response plan reviewed

---

## 11. SIGN-OFF

**Deployment Ready:** _____ (Date)  
**Deployed By:** _____ (Name)  
**Approved By:** _____ (Manager)  

**Notes:**
```
_______________________________________________________
_______________________________________________________
_______________________________________________________
```

---

**Need Help?**
- Backend Issues: Check logs with `pm2 logs resume-forge-api`
- Frontend Issues: Check browser console and Sentry dashboard
- Database Issues: Connect to MongoDB Atlas dashboard
- General: Refer to PRODUCTION_READINESS_REPORT.md
