
# Enable Camera on EC2 - No Docker, No Domain

## Quick Solution: Free Domain + Let's Encrypt

### Step 1: Get Free Domain from DuckDNS

1. Visit https://www.duckdns.org/
2. Sign in with Google/GitHub
3. Create a subdomain: `yourapp.duckdns.org`
4. Point it to your EC2 public IP
5. Save your token

### Step 2: Install Nginx and Certbot on EC2

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Nginx
sudo apt install nginx -y

# Install Certbot
sudo apt install certbot python3-certbot-nginx -y
```

### Step 3: Configure Nginx for Your App

Create nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/newborn-nest
```

Add this configuration (replace `yourapp.duckdns.org` with your actual domain):

```nginx
server {
    listen 80;
    server_name yourapp.duckdns.org;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Increase max body size for uploads
    client_max_body_size 10M;

    # Proxy to your Node.js app
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API requests
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
    }

    # Uploaded files
    location /uploads {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        expires 1y;
        add_header Cache-Control "public";
    }
}
```

Enable the site:

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/newborn-nest /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

### Step 4: Get SSL Certificate

```bash
# Get certificate (Certbot will auto-configure nginx)
sudo certbot --nginx -d yourapp.duckdns.org

# Follow prompts:
# - Enter email
# - Agree to terms
# - Choose option 2: Redirect HTTP to HTTPS
```

Certbot will automatically:
- Get SSL certificate
- Update nginx config with HTTPS
- Add HTTP to HTTPS redirect

### Step 5: Add Camera Permission Header

Edit the HTTPS nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/newborn-nest
```

Find the `server` block with `listen 443 ssl` and add this line in the server block:

```nginx
add_header Permissions-Policy "camera=(self), microphone=(self)" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

Reload nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Step 6: Configure Security Group

AWS Console > EC2 > Security Groups:

```
Inbound Rules:
- Type: HTTP, Port: 80, Source: 0.0.0.0/0
- Type: HTTPS, Port: 443, Source: 0.0.0.0/0
- Type: Custom TCP, Port: 5000, Source: 127.0.0.1/32 (localhost only)
```

### Step 7: Start Your App

```bash
# Navigate to your app directory
cd /path/to/newborn-nest-app-main

# Install dependencies (if not done)
npm install
cd backend && npm install && cd ..

# Start backend (use PM2 for production)
cd backend
npm install -g pm2
pm2 start server.js --name newborn-nest-backend

# Start frontend (if separate)
cd ..
pm2 start "npm run dev" --name newborn-nest-frontend

# Save PM2 config for auto-restart
pm2 save
pm2 startup
```

### Step 8: Test Camera

1. Visit `https://yourapp.duckdns.org`
2. Navigate to patient detail
3. Try camera capture
4. Browser should prompt for permission

### Step 9: Auto-Renewal

Certbot auto-renewal is enabled by default. Test it:

```bash
sudo certbot renew --dry-run
```

---

## Option 2: AWS Application Load Balancer (No Domain Needed)

If you want to avoid managing SSL certificates:

### Step 1: Request Certificate in ACM

1. AWS Console > Certificate Manager
2. Request public certificate
3. For domain: use `*.elb.amazonaws.com` (won't work)
   **Actually, you still need a domain for ACM**

**Note**: ACM also requires a domain. Skip to Option 3 if you absolutely can't use a domain.

---

## Option 3: Self-Signed Certificate (Development Only)

**WARNING**: Browsers will show security warnings. Users must manually accept.

### Create Self-Signed Certificate

```bash
# Create SSL directory
sudo mkdir -p /etc/nginx/ssl

# Generate certificate (valid 1 year)
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/key.pem \
  -out /etc/nginx/ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=your-ec2-ip"
```

### Update Nginx Config

```bash
sudo nano /etc/nginx/sites-available/newborn-nest
```

Add HTTPS server block:

```nginx
server {
    listen 443 ssl http2;
    server_name your-ec2-ip;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # Security headers
    add_header Permissions-Policy "camera=(self), microphone=(self)" always;
    add_header X-Frame-Options "SAMEORIGIN" always;

    # Same location blocks as HTTP version
    location / {
        proxy_pass http://localhost:5000;
        # ... rest of proxy settings
    }
}

server {
    listen 80;
    server_name your-ec2-ip;
    return 301 https://$host$request_uri;
}
```

Reload nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Accept Certificate in Browser

1. Visit `https://your-ec2-ip`
2. Browser warning: "Your connection is not private"
3. Click "Advanced" > "Proceed to [IP]"
4. Camera should work after accepting

**Downsides:**
- Users see scary warnings
- Must accept certificate on every browser/device
- Not suitable for production

---

## Option 4: Elastic IP + Route 53 (AWS Solution)

If you want a professional setup:

### Step 1: Allocate Elastic IP

```bash
# AWS Console > EC2 > Elastic IPs
# Allocate new address
# Associate with your EC2 instance
```

### Step 2: Register Domain in Route 53

```bash
# AWS Console > Route 53
# Register domain (~$12/year for .com)
```

### Step 3: Create A Record

```bash
# Route 53 > Hosted Zones > Your Domain
# Create Record:
#   Name: (blank or 'www')
#   Type: A
#   Value: Your Elastic IP
```

### Step 4: Follow Step 3-6 from Option 1

Use your Route 53 domain instead of DuckDNS.

---

## Troubleshooting

### Check if app is running

```bash
# Check backend
curl http://localhost:5000/api/health

# Check nginx
sudo systemctl status nginx

# Check what's listening on port 5000
sudo netstat -tlnp | grep 5000
```

### Check nginx logs

```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Camera still not working

```bash
# Verify HTTPS is working
curl -I https://yourapp.duckdns.org

# Check headers
curl -I https://yourapp.duckdns.org | grep -i permissions

# Browser console (F12)
# Should see camera permission prompt, not security errors
```

### PM2 process management

```bash
# List processes
pm2 list

# View logs
pm2 logs newborn-nest-backend

# Restart
pm2 restart newborn-nest-backend

# Monitor
pm2 monit
```

---

## Recommended Approach

**For Production**: Use Option 1 (DuckDNS + Let's Encrypt)
- Free
- Proper SSL certificate
- No browser warnings
- 5 minutes setup

**For Testing**: Use Option 3 (Self-signed)
- Quick setup
- Accept browser warnings
- Not for real users

**For Enterprise**: Use Option 4 (Route 53)
- Professional domain
- AWS integrated
- Costs ~$12/year

---

## Complete Setup Script (Option 1 - DuckDNS)

```bash
#!/bin/bash

# Variables
DOMAIN="yourapp.duckdns.org"  # Change this
EMAIL="your-email@example.com"  # Change this

# Update system
sudo apt update && sudo apt upgrade -y

# Install nginx and certbot
sudo apt install nginx certbot python3-certbot-nginx -y

# Create nginx config
sudo tee /etc/nginx/sites-available/newborn-nest > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/newborn-nest /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
why 

# Get SSL certificate
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m $EMAIL --redirect

# Add security headers
sudo sed -i '/listen 443 ssl/a \    add_header Permissions-Policy "camera=(self), microphone=(self)" always;\n    add_header Strict-Transport-Security "max-age=31536000" always;' /etc/nginx/sites-available/newborn-nest

sudo nginx -t
sudo systemctl reload nginx

echo "Setup complete! Visit https://$DOMAIN"
```

Save as `setup-https.sh`, update variables, then run:

```bash
chmod +x setup-https.sh
./setup-https.sh
```
