# Direct SSL on Node.js Backend (Port 5000 HTTPS)

## ⚠️ WARNING: This is NOT the recommended approach!

**Why this is bad:**
- Node.js is not optimized for SSL termination
- You lose nginx benefits (caching, load balancing, security)
- More complex to manage certificates
- Backend server restart needed for cert renewal
- Port 5000 exposed directly to internet

**Better approach:** Use nginx to handle SSL (see EC2-DEPLOYMENT-STEPS.md)

---

## If You Still Want Direct SSL on Port 5000:

### Step 1: Update server.js on EC2

```bash
# SSH to EC2
ssh -i your-key.pem ubuntu@52.66.227.191

cd ~/newborn-nest-app-main/backend

# Backup current server.js
cp server.js server-original.js

# Copy the SSL-enabled version (need to create it on EC2)
# Or manually edit server.js to add HTTPS support
```

### Step 2: Modify server.js

Add at the top:
```javascript
import https from 'https';
import fs from 'fs';
```

Replace the `app.listen()` section at the bottom with:
```javascript
// SSL Configuration
const sslOptions = {
  key: fs.readFileSync('/path/to/your/key.pem'),
  cert: fs.readFileSync('/path/to/your/cert.pem')
};

// Start HTTPS server
https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(`🚀 Server running in ${NODE_ENV} mode on port ${PORT} with SSL`);
  console.log(`🔒 HTTPS enabled`);
});
```

### Step 3: Find Your SSL Certificate Paths

```bash
# On EC2, find your certificates
sudo find /etc -name "*.pem" -o -name "*.crt" | grep -E "(ssl|nginx)"

# Common locations:
# /etc/nginx/ssl/cert.pem
# /etc/nginx/ssl/key.pem
# /etc/ssl/certs/nginx-selfsigned.crt
# /etc/ssl/private/nginx-selfsigned.key
```

### Step 4: Update Certificate Permissions

```bash
# The Node.js process needs read access to certificates
# If running as 'ubuntu' user:
sudo chmod 644 /path/to/cert.pem
sudo chmod 600 /path/to/key.pem
sudo chown ubuntu:ubuntu /path/to/cert.pem
sudo chown ubuntu:ubuntu /path/to/key.pem

# OR copy to a readable location
sudo cp /etc/nginx/ssl/cert.pem ~/newborn-nest-app-main/backend/ssl/
sudo cp /etc/nginx/ssl/key.pem ~/newborn-nest-app-main/backend/ssl/
sudo chown ubuntu:ubuntu ~/newborn-nest-app-main/backend/ssl/*
```

### Step 5: Update Backend .env

```bash
cd ~/newborn-nest-app-main/backend

cat > .env << 'EOF'
PORT=5000
NODE_ENV=production
CORS_ORIGIN=https://52.66.227.191:5000
MAX_FILE_SIZE=10485760
UPLOAD_DIR=../data
API_PREFIX=/api
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem
EOF
```

### Step 6: Restart Backend

```bash
pm2 restart newborn-nest
pm2 logs newborn-nest
```

### Step 7: Open Port 5000 in Security Group

In AWS Console:
- EC2 → Security Groups → Your instance's security group
- Add Inbound Rule:
  - Type: Custom TCP
  - Port: 5000
  - Source: 0.0.0.0/0 (or your IP)

### Step 8: Test

```bash
# From EC2
curl -k https://localhost:5000/api/health

# From your browser
https://52.66.227.191:5000/api/health
```

---

## Better Alternative (Recommended)

Instead of doing all the above, just:

1. Keep backend on HTTP port 5000 (no SSL)
2. Use nginx on port 443 with SSL
3. Nginx proxies to backend

**Access via:** `https://52.66.227.191/api/health` (port 443, nginx)

This way:
- ✅ Backend stays simple (HTTP only)
- ✅ Nginx handles SSL (what it's designed for)
- ✅ Better security and performance
- ✅ Port 5000 not exposed to internet
- ✅ Easy certificate renewal

**See EC2-DEPLOYMENT-STEPS.md for the recommended setup.**
