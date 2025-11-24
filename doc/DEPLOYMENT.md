# Deployment Guide - Newborn Nest Application

This guide provides complete instructions for deploying the Newborn Nest application to AWS EC2.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [AWS EC2 Setup](#aws-ec2-setup)
3. [Server Installation](#server-installation)
4. [Application Deployment](#application-deployment)
5. [Nginx Configuration](#nginx-configuration)
6. [PM2 Process Management](#pm2-process-management)
7. [SSL Certificate Setup (Optional)](#ssl-certificate-setup)
8. [Maintenance](#maintenance)

## Prerequisites

- AWS Account
- Domain name (optional, for custom domain)
- Basic knowledge of Linux command line
- SSH client installed on your local machine

## AWS EC2 Setup

### 1. Launch EC2 Instance

1. Log into AWS Console → EC2 Dashboard
2. Click "Launch Instance"
3. Configure:
   - **Name**: `newborn-nest-production`
   - **AMI**: Ubuntu Server 22.04 LTS
   - **Instance Type**: t2.small or larger (minimum 1GB RAM)
   - **Key Pair**: Create new or use existing
   - **Security Group**: Create with these inbound rules:
     - SSH (22) - Your IP
     - HTTP (80) - Anywhere (0.0.0.0/0)
     - HTTPS (443) - Anywhere (0.0.0.0/0)
     - Custom TCP (5000) - Anywhere (for testing, remove in production)

4. Click "Launch Instance"

### 2. Connect to EC2 Instance

```bash
# Download your key pair (.pem file) and set permissions
chmod 400 your-key.pem

# Connect to instance
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

## Server Installation

### 1. Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Node.js 20+

```bash
# Install Node.js using NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### 3. Install Nginx

```bash
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 4. Install PM2

```bash
sudo npm install -g pm2
```

### 5. Create Application Directory

```bash
# Create app directory
sudo mkdir -p /var/www/newborn-nest
sudo chown -R $USER:$USER /var/www/newborn-nest
cd /var/www/newborn-nest
```

## Application Deployment

### Method 1: Git Clone (Recommended)

```bash
# Install git if not present
sudo apt install -y git

# Clone repository
cd /var/www/newborn-nest
git clone <your-repo-url> .

# Or if already cloned, pull latest
git pull origin main
```

### Method 2: Upload Files

```bash
# From your local machine
scp -i your-key.pem -r /path/to/local/project/* ubuntu@your-ec2-ip:/var/www/newborn-nest/
```

### Build Frontend

```bash
cd /var/www/newborn-nest

# Install frontend dependencies
npm install

# Build for production
npm run build

# The dist folder will contain the production build
```

### Setup Backend

```bash
cd /var/www/newborn-nest/backend

# Install backend dependencies
npm install

# Create .env file
nano .env
```

Add the following to `.env`:

```env
PORT=5000
NODE_ENV=production
CORS_ORIGIN=http://your-domain.com
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./data
API_PREFIX=/api
```

Save and exit (Ctrl+X, Y, Enter)

### Create Data Directory

```bash
cd /var/www/newborn-nest/backend
mkdir -p data
chmod 755 data
```

## Nginx Configuration

### 1. Create Nginx Config

```bash
sudo nano /etc/nginx/sites-available/newborn-nest
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # Replace with your domain or EC2 IP

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Serve React build
    location / {
        root /var/www/newborn-nest/dist;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

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

        # Cache uploaded images
        expires 1y;
        add_header Cache-Control "public";
    }

    # Increase max body size for image uploads
    client_max_body_size 10M;
}
```

### 2. Enable Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/newborn-nest /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## PM2 Process Management

### 1. Start Backend with PM2

```bash
cd /var/www/newborn-nest/backend

# Start application
pm2 start server.js --name newborn-nest-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
# Follow the instructions output by the command above
```

### 2. PM2 Useful Commands

```bash
# View running processes
pm2 list

# View logs
pm2 logs newborn-nest-api

# Restart application
pm2 restart newborn-nest-api

# Stop application
pm2 stop newborn-nest-api

# Monitor
pm2 monit
```

## SSL Certificate Setup (Optional)

### Using Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

The certificate will auto-renew. Certbot updates Nginx config automatically.

## Maintenance

### Updating the Application

```bash
# Pull latest code
cd /var/www/newborn-nest
git pull origin main

# Rebuild frontend
npm install
npm run build

# Update backend dependencies (if needed)
cd backend
npm install

# Restart backend
pm2 restart newborn-nest-api
```

### Viewing Logs

```bash
# Backend logs
pm2 logs newborn-nest-api

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Backup Data

```bash
# Create backup
cd /var/www/newborn-nest/backend
tar -czf backup-$(date +%Y%m%d).tar.gz data/

# Download backup to local machine (from local terminal)
scp -i your-key.pem ubuntu@your-ec2-ip:/var/www/newborn-nest/backend/backup-*.tar.gz ./
```

### Monitor Disk Space

```bash
# Check disk usage
df -h

# Check data folder size
du -sh /var/www/newborn-nest/backend/data
```

## Security Best Practices

1. **Firewall**: Only allow necessary ports
2. **Regular Updates**: Keep system and dependencies updated
3. **Backups**: Implement automated backup strategy
4. **SSL**: Always use HTTPS in production
5. **Environment Variables**: Never commit .env files
6. **User Permissions**: Run application as non-root user
7. **Rate Limiting**: Consider adding rate limiting to Nginx

## Troubleshooting

### Backend Not Starting

```bash
# Check logs
pm2 logs newborn-nest-api

# Check if port is in use
sudo lsof -i :5000
```

### Nginx 502 Bad Gateway

```bash
# Check if backend is running
pm2 list

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart services
pm2 restart newborn-nest-api
sudo systemctl restart nginx
```

### Cannot Upload Images

```bash
# Check data folder permissions
ls -la /var/www/newborn-nest/backend/data

# Fix permissions if needed
chmod 755 /var/www/newborn-nest/backend/data
```

## Support

For issues or questions, refer to the main README.md or create an issue in the repository.
