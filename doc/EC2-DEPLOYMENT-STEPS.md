# EC2 Deployment Steps for Newborn Nest with HTTPS

## Current Setup Issue
- ❌ Backend on port 5000 does NOT support HTTPS directly
- ✅ Nginx on port 443 handles HTTPS and proxies to backend
- ❌ Never access: `https://52.66.227.191:5000`
- ✅ Always access: `https://52.66.227.191` (nginx handles it)

## Architecture Flow
```
Browser → https://52.66.227.191:443 (nginx with SSL)
         → http://localhost:5000 (backend, no SSL)
```

---

## Step 1: Upload Files to EC2

Upload these files to your EC2 instance:
- `nginx-ec2.conf` → `/etc/nginx/nginx.conf`
- `.env.production` → Project root
- `backend/.env.production` → Backend folder

---

## Step 2: On EC2 - Update Backend .env

```bash
# SSH to EC2
ssh -i your-key.pem ubuntu@52.66.227.191

# Navigate to project
cd ~/newborn-nest-app-main/backend

# Create/Update production .env
cat > .env << 'EOF'
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://52.66.227.191
MAX_FILE_SIZE=10485760
UPLOAD_DIR=../data
API_PREFIX=/api
EOF
```

---

## Step 3: Update Nginx Configuration

```bash
# Find your SSL certificate paths (where you created them)
ls -la /etc/nginx/ssl/
# OR
ls -la /etc/ssl/certs/

# Edit nginx config with correct SSL paths
sudo nano /etc/nginx/nginx.conf
```

**Update these lines (around line 37-38):**
```nginx
ssl_certificate /path/to/your/cert.pem;      # Update this
ssl_certificate_key /path/to/your/key.pem;   # Update this
```

**Also update frontend path (line 59):**
```nginx
root /home/ubuntu/newborn-nest-app-main/frontend/dist;
```

---

## Step 4: Build Frontend for Production

```bash
cd ~/newborn-nest-app-main

# Install dependencies if needed
npm install

# Build frontend with production env
npm run build

# Verify build created
ls -la frontend/dist/
```

---

## Step 5: Restart Backend with PM2

```bash
cd ~/newborn-nest-app-main/backend

# Restart backend with new config
pm2 restart newborn-nest

# Check backend is running
pm2 status
pm2 logs newborn-nest --lines 50
```

---

## Step 6: Restart Nginx

```bash
# Test nginx config
sudo nginx -t

# If OK, restart nginx
sudo systemctl restart nginx

# Check nginx status
sudo systemctl status nginx

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
```

---

## Step 7: Configure EC2 Security Group

Make sure these ports are open in your EC2 Security Group:
- Port 80 (HTTP) - for redirect to HTTPS
- Port 443 (HTTPS) - for nginx
- Port 5000 should NOT be accessible from outside (only localhost)

---

## Step 8: Test the Setup

### Test Health Endpoint
```bash
# From EC2 (internal)
curl http://localhost:5000/api/health

# From browser (external)
https://52.66.227.191/api/health
```

### Test Upload
1. Open browser: `https://52.66.227.191`
2. Accept self-signed certificate warning
3. Try uploading an image
4. Check backend logs: `pm2 logs newborn-nest`

---

## Common Issues & Solutions

### Issue 1: "This site can't provide a secure connection"
**Cause:** Trying to access backend directly on port 5000 with HTTPS
**Solution:** Access via nginx on port 443: `https://52.66.227.191`

### Issue 2: CORS Error
**Cause:** Backend CORS doesn't allow the origin
**Solution:** Update `backend/.env`:
```bash
CORS_ORIGIN=https://52.66.227.191
```

### Issue 3: Upload Failed
**Cause:** Nginx not proxying correctly or file size limit
**Solution:**
- Check nginx config: `client_max_body_size 10M;`
- Check backend logs: `pm2 logs newborn-nest`
- Verify data directory permissions: `ls -la ~/newborn-nest-app-main/data`

### Issue 4: 404 Errors
**Cause:** Frontend build not served correctly
**Solution:**
- Verify build exists: `ls ~/newborn-nest-app-main/frontend/dist/`
- Check nginx root path matches
- Rebuild: `npm run build`

---

## Verify Everything Works

```bash
# 1. Check backend is running
pm2 status
curl http://localhost:5000/api/health

# 2. Check nginx is running
sudo systemctl status nginx

# 3. Check nginx config
sudo nginx -t

# 4. Check ports
sudo netstat -tlnp | grep -E ':(80|443|5000)'

# 5. Test from outside
curl -k https://52.66.227.191/api/health
```

---

## Where SSL Certificates Should Be

Your self-signed certificates should be at one of these locations:
```bash
/etc/nginx/ssl/cert.pem
/etc/nginx/ssl/key.pem

# OR

/etc/ssl/certs/nginx-selfsigned.crt
/etc/ssl/private/nginx-selfsigned.key
```

Find them with:
```bash
sudo find /etc -name "*.crt" -o -name "*.pem" | grep -v ca-certificates
```

---

## Final Checklist

- [ ] Backend running on port 5000 (HTTP only)
- [ ] Nginx running on port 443 (HTTPS)
- [ ] SSL certificates configured in nginx
- [ ] Frontend built and placed in dist/
- [ ] Backend .env has `CORS_ORIGIN=https://52.66.227.191`
- [ ] Security group allows ports 80, 443 (NOT 5000 externally)
- [ ] Can access: `https://52.66.227.191/api/health`
- [ ] Upload works through nginx

---

## Access URLs

✅ **Correct:**
- `https://52.66.227.191` → Full app (nginx serves frontend + proxies API)
- `https://52.66.227.191/api/health` → Backend health check via nginx

❌ **Wrong:**
- `https://52.66.227.191:5000` → Backend doesn't support HTTPS
- `http://52.66.227.191` → Will redirect to HTTPS
