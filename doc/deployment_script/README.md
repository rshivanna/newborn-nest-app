# EC2 Deployment Scripts

This directory contains deployment scripts for fixing and configuring the Newborn Nest application on AWS EC2.

## Scripts

### fix-frontend-backend-connection.sh

Automatically fixes the connection issue between frontend and backend on EC2 deployment.

**What it does:**
1. Detects EC2 public IP automatically
2. Creates frontend `.env.production` with correct API URL
3. Configures backend `.env` with CORS settings
4. Ensures data directory exists with correct permissions
5. Installs all dependencies
6. Builds frontend with production configuration
7. Verifies build has no localhost references
8. Restarts backend (PM2) and nginx
9. Tests backend health
10. Provides detailed status and troubleshooting info

## Usage

### Prerequisites

- SSH access to your EC2 instance
- Project deployed at `/var/www/newborn-nest` (or similar)
- PM2 installed globally (`npm install -g pm2`)
- Nginx installed and configured
- Git installed (if using git pull method)

### Method 1: Download and Run on EC2

```bash
# SSH to your EC2 instance
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Navigate to project directory
cd /var/www/newborn-nest

# Pull latest changes (if using git)
git pull origin main

# Make script executable
chmod +x deployment_script/fix-frontend-backend-connection.sh

# Run the script
./deployment_script/fix-frontend-backend-connection.sh
```

### Method 2: Upload Script Separately

```bash
# From your local machine
scp -i your-key.pem deployment_script/fix-frontend-backend-connection.sh ubuntu@YOUR_EC2_IP:/tmp/

# SSH to EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Navigate to project directory
cd /var/www/newborn-nest

# Copy script to project
cp /tmp/fix-frontend-backend-connection.sh .

# Make executable
chmod +x fix-frontend-backend-connection.sh

# Run it
./fix-frontend-backend-connection.sh
```

### Method 3: Copy-Paste Execution

```bash
# SSH to EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Navigate to project
cd /var/www/newborn-nest

# Download script directly from GitHub (if hosted)
curl -O https://raw.githubusercontent.com/YOUR_REPO/main/deployment_script/fix-frontend-backend-connection.sh

# Or create the script manually
nano fix-frontend-backend-connection.sh
# (paste the script content)

# Make executable
chmod +x fix-frontend-backend-connection.sh

# Run it
./fix-frontend-backend-connection.sh
```

## Script Output

The script provides colored output for easy reading:
- ✓ Green: Success messages
- ✗ Red: Error messages
- ℹ Blue: Information messages
- ⚠ Yellow: Warning messages

Example output:
```
==================================================
Step 1: Checking Directory
==================================================

✓ Running from correct directory: /var/www/newborn-nest

==================================================
Step 2: Detecting EC2 Public IP
==================================================

✓ Detected EC2 Public IP: 52.66.227.191

...
```

## What Gets Created/Modified

### Files Created:
- `.env.production` (frontend) - Contains `VITE_API_URL=/api`
- `backend/.env` (if doesn't exist) - Complete backend configuration

### Files Modified:
- `backend/.env` - CORS_ORIGIN updated to EC2 IP
- `dist/` - Rebuilt with correct configuration

### Backups:
- `.env.production.backup` - Created if .env.production already exists

## Verification Steps

After the script completes, verify the deployment:

### 1. Check Configuration Files

```bash
# Frontend config
cat .env.production
# Should show: VITE_API_URL=/api

# Backend config
cat backend/.env | grep CORS
# Should show: CORS_ORIGIN=http://YOUR_EC2_IP
```

### 2. Verify Build

```bash
# Check for localhost references (should find nothing)
grep -r "localhost:5000" dist/ || echo "✓ Build is clean"
```

### 3. Test Backend

```bash
# Test backend health endpoint
curl http://localhost:5000/api/health

# Expected response:
# {"status":"ok","environment":"production","timestamp":"..."}
```

### 4. Check Services

```bash
# Check PM2
pm2 list

# Check Nginx
sudo systemctl status nginx

# Check backend logs
pm2 logs newborn-nest-api
```

### 5. Browser Testing

1. Open: `http://YOUR_EC2_IP`
2. Press F12 (Developer Console)
3. **Console tab**: Look for errors
   - Should see NO CORS errors
   - Should see NO "Failed to fetch" errors
   - Should see NO references to localhost
4. **Network tab**: Check API requests
   - Should see requests to `/api/patients`
   - NOT to `http://localhost:5000/api/patients`
   - Status should be 200 OK
5. **Test features**:
   - Create new patient ✓
   - Upload images ✓
   - View patient list ✓

## Troubleshooting

### Script Fails at Step X

The script exits on error (`set -e`). Check the error message and:

1. **Permission denied**: Run with proper permissions or use sudo
2. **Directory not found**: Ensure you're in the project root
3. **Command not found**: Install missing dependencies (npm, pm2, nginx)

### Backend Not Starting

```bash
# Check PM2 logs
pm2 logs newborn-nest-api

# Check if port 5000 is in use
sudo lsof -i :5000

# Restart backend manually
cd backend
pm2 restart newborn-nest-api
```

### Build Still Has localhost References

```bash
# Check if .env.production exists
cat .env.production

# Force clean rebuild
rm -rf dist/
rm -rf node_modules/.vite
NODE_ENV=production npm run build

# Verify again
grep -r "localhost:5000" dist/
```

### CORS Errors in Browser

```bash
# Verify backend CORS configuration
cat backend/.env | grep CORS

# Should match your EC2 public IP
# If not, edit and restart:
nano backend/.env
pm2 restart newborn-nest-api
```

### 502 Bad Gateway

```bash
# Check if backend is running
pm2 list

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart both services
pm2 restart newborn-nest-api
sudo systemctl restart nginx
```

## Manual Rollback

If the script causes issues, you can rollback:

```bash
# Restore backup frontend config (if exists)
if [ -f .env.production.backup ]; then
    mv .env.production.backup .env.production
fi

# Rebuild frontend
NODE_ENV=production npm run build

# Restart services
pm2 restart newborn-nest-api
sudo systemctl reload nginx
```

## Environment Variables Reference

### Frontend (.env.production)
```env
VITE_API_URL=/api
```
- Used at BUILD time
- Bundled into static files
- Cannot change after build

### Backend (backend/.env)
```env
PORT=5000
NODE_ENV=production
CORS_ORIGIN=http://YOUR_EC2_IP
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./data
API_PREFIX=/api
```
- Used at RUNTIME
- Can be changed anytime
- Requires backend restart after changes

## Security Notes

1. **CORS Origin**: Set to specific IP/domain, not wildcard (*)
2. **File Uploads**: Max size limited to 5MB (adjustable)
3. **Data Directory**: Permissions set to 755 (readable by nginx)
4. **Environment Files**: Never commit to git (in .gitignore)

## Related Documentation

- [Frontend-Backend Connection Fix Guide](../doc/frontend-backend-connection-fix.md)
- [Deployment Guide](../doc/DEPLOYMENT.md)
- [EC2 Deploy Config](../doc/ec2-deploy-config.md)
- [Troubleshooting Guide](../doc/TROUBLESHOOTING.md)

## Support

If you encounter issues:
1. Check the script output for specific error messages
2. Review the troubleshooting section above
3. Check related documentation
4. Review logs: `pm2 logs` and `/var/log/nginx/error.log`

## Script Updates

To update the script:
1. Edit locally
2. Commit to git
3. Pull on EC2: `git pull origin main`
4. Run updated script

Or download directly:
```bash
curl -O https://raw.githubusercontent.com/YOUR_REPO/main/deployment_script/fix-frontend-backend-connection.sh
chmod +x fix-frontend-backend-connection.sh
./fix-frontend-backend-connection.sh
```
