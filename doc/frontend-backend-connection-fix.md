# Frontend-Backend Connection Fix for EC2 Deployment

**Date**: 2025-11-20
**EC2 Public IP**: 52.66.227.191
**Issue**: Frontend and backend work independently but cannot connect to each other

---

## Problems Identified

### 1. Frontend API URL Configuration Missing

**Location**: `src/services/api.ts:5`

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
```

**Issue**:
- When built without `VITE_API_URL` environment variable, the frontend hardcodes `http://localhost:5000/api`
- Browser tries to connect to localhost (which doesn't work from outside EC2)
- The browser runs on the client's machine, not on the EC2 server

### 2. Missing .env.production for Frontend

**Current State**:
- Backend has `.env.production` configured correctly:
  - `CORS_ORIGIN=http://52.66.227.191` ✓
  - Port 5000 ✓
- Frontend is missing a `.env.production` file to set `VITE_API_URL`

**Why This Matters**:
- Vite uses environment variables at build time
- Without `.env.production`, it uses the default `localhost:5000`
- The built files are static and cannot change after build

### 3. Vite Proxy Only Works in Dev Mode

**Location**: `vite.config.ts:11-16`

```typescript
proxy: {
  '/api': {
    target: 'http://localhost:5000',
    changeOrigin: true,
  },
}
```

**Issue**:
- This proxy configuration only works during `npm run dev`
- Production builds (`npm run build`) create static files that ignore proxy settings
- The built frontend makes direct API calls from the browser

---

## Architecture Overview

### Development Flow (Works)
```
Browser → Vite Dev Server (port 8080) → Proxy → Backend (port 5000)
```

### Production Flow (Current - Broken)
```
Browser → Nginx → Static Files (dist/)
Browser → http://localhost:5000/api ❌ (Cannot reach from outside EC2)
```

### Production Flow (Fixed)
```
Browser → Nginx → Static Files (dist/)
Browser → /api → Nginx Proxy → Backend (port 5000) ✓
```

---

## Solutions

### Option 1: Use Relative URLs (Recommended)

**Assumes**: Nginx is configured to proxy `/api` to backend (port 5000)

**Step 1**: Create `.env.production` in root directory

```bash
cd /var/www/newborn-nest
nano .env.production
```

**Content**:
```env
VITE_API_URL=/api
```

**Step 2**: Rebuild Frontend
```bash
NODE_ENV=production npm run build
```

**Step 3**: Restart Services
```bash
pm2 restart newborn-nest-api
sudo systemctl reload nginx
```

**Advantages**:
- Works with any domain or IP
- No hardcoded URLs
- HTTPS compatible
- More flexible for future changes

---

### Option 2: Use Full EC2 URL

**Step 1**: Create `.env.production`

```env
VITE_API_URL=http://52.66.227.191:5000/api
```

**Step 2**: Rebuild and restart as above

**Disadvantages**:
- Hardcoded IP address
- Need to expose port 5000 in security group
- Won't work with HTTPS
- Must rebuild if IP changes

---

## Complete Fix Commands (Option 1 - Recommended)

Run these commands on your EC2 instance:

```bash
# Navigate to project directory
cd /var/www/newborn-nest

# Create frontend production config
echo "VITE_API_URL=/api" > .env.production

# Rebuild frontend with production config
NODE_ENV=production npm run build

# Verify no localhost references in build
grep -r "localhost:5000" dist/ || echo "✓ Build is correct"

# Restart backend
pm2 restart newborn-nest-api

# Reload nginx
sudo systemctl reload nginx

# Test backend health
curl http://localhost:5000/api/health
```

---

## Verification Steps

### 1. Check Backend Configuration

```bash
# Verify backend .env
cat /var/www/newborn-nest/backend/.env | grep CORS
# Expected output: CORS_ORIGIN=http://52.66.227.191
```

### 2. Verify Frontend Build

```bash
# Check that localhost is NOT in the build
grep -r "localhost:5000" /var/www/newborn-nest/dist/

# If found, rebuild with:
NODE_ENV=production npm run build
```

### 3. Check Services Status

```bash
# Check PM2
pm2 list
# Should show: newborn-nest-api | online

# Check nginx
sudo systemctl status nginx
# Should show: active (running)

# Check nginx config
sudo nginx -t
# Should show: syntax is ok
```

### 4. Test Backend API

```bash
# From EC2 (internal)
curl http://localhost:5000/api/health

# Expected response:
# {"status":"ok","environment":"production","timestamp":"..."}
```

### 5. Test Frontend Connection

Open browser to: `http://52.66.227.191`

**Developer Console** (F12):
- **Console tab**: Should see NO errors about:
  - CORS
  - Failed to fetch
  - localhost
- **Network tab**: Should see requests to:
  - `/api/patients` (NOT `http://localhost:5000/api/patients`)
  - Status: 200 OK

**Test Features**:
- Create new patient ✓
- Upload images ✓
- View patient list ✓

---

## Nginx Configuration Required

Ensure your nginx config has the API proxy:

**File**: `/etc/nginx/sites-available/newborn-nest`

```nginx
# Proxy API requests to Node.js backend
location /api {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;

    # Increase timeouts for file uploads
    proxy_read_timeout 300;
    proxy_connect_timeout 300;
    proxy_send_timeout 300;
}

# Serve uploaded images
location /uploads {
    alias /var/www/newborn-nest/backend/data;
    autoindex off;
    expires 1y;
    add_header Cache-Control "public";
}
```

---

## Troubleshooting

### Issue: Still seeing localhost in browser

**Solution**:
```bash
cd /var/www/newborn-nest

# Check if .env.production exists
cat .env.production
# Should show: VITE_API_URL=/api

# Force clean rebuild
rm -rf dist/
rm -rf node_modules/.vite
NODE_ENV=production npm run build

# Verify
grep -r "localhost:5000" dist/ || echo "✓ Build is correct"
```

### Issue: CORS errors in browser console

**Solution**:
```bash
# Check backend CORS config
cat /var/www/newborn-nest/backend/.env | grep CORS

# Should be: CORS_ORIGIN=http://52.66.227.191
# If not, fix it:
nano /var/www/newborn-nest/backend/.env

# Restart backend
pm2 restart newborn-nest-api
```

### Issue: 502 Bad Gateway

**Solution**:
```bash
# Check if backend is running
pm2 list

# If not running, start it
pm2 restart newborn-nest-api

# Check logs
pm2 logs newborn-nest-api

# Check if port 5000 is in use
sudo lsof -i :5000
```

### Issue: 404 Not Found for /api

**Solution**:
```bash
# Check nginx config
sudo nginx -t

# Check if API location block exists
cat /etc/nginx/sites-available/newborn-nest | grep -A 10 "location /api"

# Reload nginx
sudo systemctl reload nginx
```

---

## Understanding the Flow

### How Frontend Finds Backend

**Development** (`npm run dev`):
```
1. Browser requests: fetch('/api/patients')
2. Vite dev server intercepts: /api/patients
3. Vite proxy rewrites to: http://localhost:5000/api/patients
4. Backend responds
```

**Production (Broken)**:
```
1. Browser loads: http://52.66.227.191 from nginx
2. Browser executes JS: fetch('http://localhost:5000/api/patients')
3. Browser tries to connect to: localhost:5000 ❌
4. Fails - localhost is the user's computer, not EC2
```

**Production (Fixed with /api)**:
```
1. Browser loads: http://52.66.227.191 from nginx
2. Browser executes JS: fetch('/api/patients')
3. Browser sends request to: http://52.66.227.191/api/patients
4. Nginx proxies to: http://localhost:5000/api/patients
5. Backend responds ✓
```

---

## File Structure on EC2

```
/var/www/newborn-nest/
├── .env.production          # Frontend config (VITE_API_URL=/api)
├── dist/                    # Built frontend (served by nginx)
│   ├── index.html
│   └── assets/
├── backend/
│   ├── .env                # Backend config (CORS, PORT, etc)
│   ├── server.js           # Backend entry point
│   └── data/               # Uploaded images
├── src/                    # Frontend source
│   └── services/
│       └── api.ts          # API client (uses VITE_API_URL)
└── vite.config.ts          # Vite config (proxy only for dev)
```

---

## Environment Variables Summary

### Frontend (.env.production)
```env
VITE_API_URL=/api
```
- Used at BUILD time by Vite
- Bundled into the static JavaScript files
- Cannot be changed after build

### Backend (backend/.env)
```env
PORT=5000
NODE_ENV=production
CORS_ORIGIN=http://52.66.227.191
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./data
API_PREFIX=/api
```
- Used at RUNTIME by Node.js
- Can be changed without rebuilding
- Restart PM2 after changes

---

## Quick Reference Commands

```bash
# Check what's running
pm2 list
sudo systemctl status nginx

# View logs
pm2 logs newborn-nest-api
sudo tail -f /var/log/nginx/error.log

# Restart services
pm2 restart newborn-nest-api
sudo systemctl reload nginx

# Test backend
curl http://localhost:5000/api/health

# Test from browser
curl http://52.66.227.191/api/health

# Rebuild frontend
cd /var/www/newborn-nest
NODE_ENV=production npm run build
```

---

## Related Files

- **API Client**: `src/services/api.ts`
- **Vite Config**: `vite.config.ts`
- **Backend Server**: `backend/server.js`
- **Backend Config**: `backend/.env`
- **Frontend Config**: `.env.production`
- **Nginx Config**: `/etc/nginx/sites-available/newborn-nest`

---

## Summary

**Root Cause**: Frontend built with hardcoded `localhost:5000` because `VITE_API_URL` was not set during build.

**Solution**: Create `.env.production` with `VITE_API_URL=/api` and rebuild frontend.

**Why This Works**: Browser makes relative requests to `/api`, nginx proxies them to backend on `localhost:5000`.

**Next Steps**: Always rebuild frontend after changing `.env.production` or when deploying updates.
