# Fix: Upload Failed with 500 Error on EC2 with HTTPS Self-Signed Certificate

## Problem
When deploying to EC2 with HTTPS using a self-signed certificate, image uploads fail with a 500 Internal Server Error.

## Root Cause
The issue occurs when:
1. Frontend makes HTTPS requests to nginx (with self-signed cert)
2. Backend CORS configuration doesn't match the HTTPS origin
3. Node.js may reject self-signed certificates if making internal HTTPS requests
4. Nginx not properly configured to handle large file uploads over HTTPS

## Solution

### Step 1: Update Backend .env for HTTPS

SSH to your EC2 instance and update the backend .env:

```bash
ssh -i your-key.pem ubuntu@52.66.227.191

cd ~/newborn-nest-app-main/backend
nano .env
```

**Update to:**
```env
# Server Configuration
PORT=5000
NODE_ENV=production

# IMPORTANT: Use HTTPS in CORS_ORIGIN
CORS_ORIGIN=https://52.66.227.191

# File Upload Configuration
MAX_FILE_SIZE=10485760

# Data Directory
UPLOAD_DIR=../data

# API Configuration
API_PREFIX=/api

# SSL Configuration (for self-signed certificates)
NODE_TLS_REJECT_UNAUTHORIZED=0
```

**Key Changes:**
- `CORS_ORIGIN=https://52.66.227.191` (use **https** not http)
- `NODE_TLS_REJECT_UNAUTHORIZED=0` (accept self-signed certificates)

### Step 2: Update Nginx Configuration

Edit nginx config to handle HTTPS uploads properly:

```bash
sudo nano /etc/nginx/nginx.conf
```

**Or if using sites-available:**
```bash
sudo nano /etc/nginx/sites-available/newborn-nest
```

**Add/Update these settings in the `server` block:**

```nginx
server {
    listen 443 ssl http2;
    server_name 52.66.227.191;

    # SSL Certificate paths
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # CRITICAL: Increase these for file uploads
    client_max_body_size 20M;
    client_body_buffer_size 20M;
    client_body_timeout 120s;

    # Security headers
    add_header Permissions-Policy "camera=(self), microphone=(self)" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Serve frontend
    location / {
        root /home/ubuntu/newborn-nest-app-main/frontend/dist;
        try_files $uri $uri/ /index.html;
        index index.html;
    }

    # Proxy API requests to backend
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;

        # Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;

        # CRITICAL: Increase timeouts for uploads
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        send_timeout 300s;

        # CRITICAL: Allow large request bodies
        client_max_body_size 20M;
        client_body_buffer_size 20M;
    }

    # Serve uploaded images
    location /uploads {
        alias /home/ubuntu/newborn-nest-app-main/data;
        autoindex off;
        expires 1y;
        add_header Cache-Control "public";
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name 52.66.227.191;
    return 301 https://$host$request_uri;
}
```

### Step 3: Update Frontend .env.production

```bash
cd ~/newborn-nest-app-main
nano .env.production
```

**Content:**
```env
VITE_API_URL=/api
```

### Step 4: Rebuild Frontend

```bash
cd ~/newborn-nest-app-main

# Rebuild with production config
NODE_ENV=production npm run build

# Verify no localhost references
grep -r "localhost:5000" dist/ || echo "✓ Build is correct"
```

### Step 5: Restart Services

```bash
# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Restart backend with new environment
pm2 restart newborn-nest-api

# Check backend logs
pm2 logs newborn-nest-api --lines 20
```

### Step 6: Verify Configuration

```bash
# 1. Check backend .env
cat ~/newborn-nest-app-main/backend/.env | grep CORS
# Should show: CORS_ORIGIN=https://52.66.227.191

# 2. Check nginx syntax
sudo nginx -t

# 3. Test backend health
curl http://localhost:5000/api/health

# 4. Test from outside (accept certificate warning)
curl -k https://52.66.227.191/api/health
```

## Testing Upload

### 1. Open Browser
Visit: `https://52.66.227.191`

### 2. Accept Self-Signed Certificate Warning
- Chrome: Click "Advanced" → "Proceed to 52.66.227.191"
- Firefox: Click "Advanced" → "Accept the Risk and Continue"

### 3. Open Developer Tools (F12)
Check Console tab for any errors

### 4. Test Upload
1. Click "Add New Patient"
2. Fill in required fields
3. Try taking a photo or uploading an image
4. Check Network tab in DevTools:
   - Request URL should be: `https://52.66.227.191/api/patients`
   - Status should be: `201 Created` (not 500)
   - Check Response tab for any error messages

## Troubleshooting

### Still Getting 500 Error

#### Check Backend Logs:
```bash
pm2 logs newborn-nest-api --lines 50
```

Common errors and solutions:

**1. "ENOENT: no such file or directory"**
```bash
# Create data directory
mkdir -p ~/newborn-nest-app-main/data
chmod 755 ~/newborn-nest-app-main/data
```

**2. "CORS policy error"**
```bash
# Verify CORS_ORIGIN is set to https (not http)
cat ~/newborn-nest-app-main/backend/.env | grep CORS
# Should show: CORS_ORIGIN=https://52.66.227.191

# If wrong, fix it:
cd ~/newborn-nest-app-main/backend
nano .env  # Change to CORS_ORIGIN=https://52.66.227.191
pm2 restart newborn-nest-api
```

**3. "413 Request Entity Too Large"**
```bash
# Increase client_max_body_size in nginx
sudo nano /etc/nginx/nginx.conf
# Add in http block: client_max_body_size 20M;
sudo nginx -t && sudo systemctl reload nginx
```

**4. "504 Gateway Timeout"**
```bash
# Increase proxy timeouts in nginx (see Step 2)
# Then reload: sudo systemctl reload nginx
```

### Check Nginx Error Logs

```bash
sudo tail -f /var/log/nginx/error.log
```

### Test Upload with curl

```bash
# Test uploading a file
curl -k -X POST https://52.66.227.191/api/patients \
  -F "babyName=Test Baby" \
  -F "motherName=Test Mother" \
  -F "address=Test Address" \
  -F "babyDetails[gestationalAge]=38" \
  -F "face=@/path/to/test-image.jpg"
```

## Security Warning

**⚠️ IMPORTANT:**

`NODE_TLS_REJECT_UNAUTHORIZED=0` should **ONLY** be used with self-signed certificates in development/testing.

**For Production:**
1. Use a proper SSL certificate (Let's Encrypt is free)
2. Remove `NODE_TLS_REJECT_UNAUTHORIZED=0`
3. Use DuckDNS or Route 53 for a domain name

See `EC2_HTTPS_NO_DOCKER.md` for setting up free SSL with Let's Encrypt.

## Quick Checklist

- [ ] Backend `.env` has `CORS_ORIGIN=https://52.66.227.191`
- [ ] Backend `.env` has `NODE_TLS_REJECT_UNAUTHORIZED=0`
- [ ] Frontend `.env.production` has `VITE_API_URL=/api`
- [ ] Frontend rebuilt: `NODE_ENV=production npm run build`
- [ ] Nginx has `client_max_body_size 20M`
- [ ] Nginx has increased proxy timeouts (300s)
- [ ] Nginx SSL certificate paths are correct
- [ ] Backend restarted: `pm2 restart newborn-nest-api`
- [ ] Nginx reloaded: `sudo systemctl reload nginx`
- [ ] Browser accepts self-signed certificate
- [ ] No CORS errors in browser console
- [ ] Upload works successfully

## Alternative: Use Proper SSL Certificate

Instead of using self-signed certificates, get a free SSL certificate:

**Option 1: DuckDNS + Let's Encrypt (Free)**
```bash
# See EC2_HTTPS_NO_DOCKER.md for complete guide
```

**Option 2: AWS Certificate Manager + ALB**
```bash
# See EC2_HTTPS_SETUP.md Method 2
```

This eliminates browser warnings and security issues!

## Summary

The 500 error with HTTPS self-signed certificates is typically caused by:

1. **CORS mismatch** - Backend expects `http://` but receives `https://`
2. **Certificate validation** - Node.js rejects self-signed certificates
3. **Nginx limits** - File size or timeout limits too small
4. **Missing rebuild** - Frontend still using `localhost:5000`

The fix requires:
1. Update backend CORS to use `https://`
2. Add `NODE_TLS_REJECT_UNAUTHORIZED=0` for self-signed certs
3. Increase nginx file size and timeout limits
4. Rebuild frontend with correct API URL
5. Restart all services

After applying these fixes, uploads should work with HTTPS self-signed certificates.
