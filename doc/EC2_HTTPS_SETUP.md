# Enabling Camera Access on EC2 - HTTPS Setup Guide

## Why HTTPS is Required

Modern browsers **block camera and microphone access** on non-HTTPS connections for security reasons. Your app works locally because `localhost` is exempt, but on EC2, you must use HTTPS.

## Prerequisites

1. EC2 instance running your application
2. Domain name pointed to your EC2 IP address
3. Security group allowing ports 80 and 443

## Method 1: Let's Encrypt (Recommended - Free)

### Step 1: Configure EC2 Security Group

Ensure your EC2 security group allows:
- Port 80 (HTTP) - for certificate verification
- Port 443 (HTTPS) - for secure traffic

```bash
# AWS Console > EC2 > Security Groups > Inbound Rules
Type: HTTP, Port: 80, Source: 0.0.0.0/0
Type: HTTPS, Port: 443, Source: 0.0.0.0/0
```

### Step 2: Point Domain to EC2

In your domain registrar (GoDaddy, Namecheap, etc.):
```
Type: A Record
Name: @ (or your subdomain)
Value: <your-ec2-ip-address>
TTL: 300
```

Wait for DNS propagation (5-30 minutes). Verify:
```bash
nslookup your-domain.com
```

### Step 3: SSH into EC2 and Install Certbot

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Certbot
sudo apt install certbot -y
```

### Step 4: Stop Your Docker Containers

```bash
# Stop containers to free port 80 for Certbot
docker-compose down
```

### Step 5: Get SSL Certificate

```bash
# Get certificate (standalone mode)
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Certificates will be saved to:
#   /etc/letsencrypt/live/your-domain.com/
```

### Step 6: Update nginx.conf

Replace `your-domain.com` in the nginx.conf file with your actual domain:

```bash
# Edit the nginx.conf file
sed -i 's/your-domain.com/actual-domain.com/g' nginx.conf
```

Or manually edit `nginx.conf` lines 35, 38, and 39.

### Step 7: Mount SSL Certificates in Docker

Update your `docker-compose.yml` to include SSL certificates:

```yaml
services:
  nginx:
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro  # Add this line
```

### Step 8: Rebuild and Restart

```bash
# Rebuild with new configuration
docker-compose build

# Start services
docker-compose up -d

# Check logs
docker-compose logs nginx
```

### Step 9: Test Camera Access

1. Visit `https://your-domain.com`
2. Navigate to patient detail page
3. Try camera capture
4. Browser should prompt for camera permission

### Step 10: Auto-Renewal Setup

Let's Encrypt certificates expire after 90 days. Set up auto-renewal:

```bash
# Test renewal
sudo certbot renew --dry-run

# Add cron job for auto-renewal
sudo crontab -e

# Add this line (runs twice daily):
0 0,12 * * * certbot renew --quiet --deploy-hook "docker-compose -f /path/to/docker-compose.yml restart nginx"
```

## Method 2: AWS Certificate Manager + Application Load Balancer

If you want AWS-managed certificates:

### Step 1: Request Certificate
1. AWS Console > Certificate Manager
2. Request a public certificate
3. Enter your domain name
4. Choose DNS validation
5. Add CNAME record to your DNS

### Step 2: Create Application Load Balancer
1. EC2 > Load Balancers > Create
2. Add HTTPS listener (port 443)
3. Attach your ACM certificate
4. Configure target group pointing to EC2 instance

### Step 3: Update Security Group
- Allow traffic from ALB security group only
- ALB handles HTTPS termination

## Method 3: Self-Signed Certificate (Development Only)

**Warning**: Browsers will show security warnings. Not recommended for production.

```bash
# Generate self-signed certificate
sudo mkdir -p /etc/nginx/ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/key.pem \
  -out /etc/nginx/ssl/cert.pem

# Update nginx.conf to use /etc/nginx/ssl/ paths
# Mount in docker-compose.yml:
# - /etc/nginx/ssl:/etc/nginx/ssl:ro
```

## Troubleshooting

### Camera still not working after HTTPS setup

1. **Check browser console** (F12):
   ```
   DOMException: Permission denied
   ```
   - User denied camera permission
   - Click camera icon in browser address bar

2. **Mixed content error**:
   - Ensure all resources load over HTTPS
   - Check API calls use HTTPS endpoints

3. **Certificate errors**:
   ```bash
   # Verify certificate
   sudo certbot certificates

   # Check nginx config
   docker exec -it <nginx-container> nginx -t
   ```

4. **Port 443 not accessible**:
   ```bash
   # Test from outside EC2
   curl -I https://your-domain.com

   # Check if nginx is listening
   docker exec -it <nginx-container> netstat -tlnp | grep 443
   ```

### Browser Permission Issues

1. **Clear browser site settings**:
   - Chrome: Settings > Privacy > Site Settings > Camera
   - Remove your domain and try again

2. **Check Permissions-Policy header**:
   - Browser DevTools > Network > Select request > Headers
   - Should see: `Permissions-Policy: camera=(self), microphone=(self)`

3. **Test getUserMedia directly**:
   ```javascript
   // Browser console
   navigator.mediaDevices.getUserMedia({ video: true })
     .then(stream => console.log('Camera works!'))
     .catch(err => console.error(err))
   ```

## Verification Checklist

- [ ] Domain points to EC2 IP
- [ ] Ports 80 and 443 open in security group
- [ ] SSL certificate installed
- [ ] nginx.conf updated with domain name
- [ ] Docker containers mounting SSL certificates
- [ ] HTTPS site loads without certificate errors
- [ ] Camera permission prompt appears
- [ ] Camera capture works successfully

## Additional Security Headers

The updated nginx.conf includes:

- `Permissions-Policy: camera=(self)` - Explicitly allow camera access
- `Strict-Transport-Security` - Force HTTPS
- `X-Frame-Options` - Prevent clickjacking
- `X-Content-Type-Options` - Prevent MIME sniffing

## Support

For certificate issues:
```bash
# Check Certbot logs
sudo cat /var/log/letsencrypt/letsencrypt.log

# Verify certificate
sudo openssl x509 -in /etc/letsencrypt/live/your-domain.com/fullchain.pem -text -noout
```

For nginx issues:
```bash
# Check nginx logs
docker-compose logs nginx

# Test nginx config
docker exec <nginx-container> nginx -t
```
