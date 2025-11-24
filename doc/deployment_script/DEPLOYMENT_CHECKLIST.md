# EC2 Deployment Checklist

Use this checklist to ensure all steps are completed correctly.

## Pre-Deployment Checklist

### Local Machine

- [ ] All changes committed to git
- [ ] All changes pushed to remote repository
- [ ] No sensitive data in code (API keys, passwords, etc.)
- [ ] `.gitignore` includes `.env` files
- [ ] Documentation updated if needed
- [ ] Tested locally with `npm run dev`

### EC2 Instance Setup

- [ ] EC2 instance launched (Ubuntu 22.04 LTS recommended)
- [ ] Instance type: t2.small or larger (min 1GB RAM)
- [ ] Security group configured:
  - [ ] SSH (22) - Your IP only
  - [ ] HTTP (80) - Anywhere (0.0.0.0/0)
  - [ ] HTTPS (443) - Anywhere (0.0.0.0/0)
- [ ] Elastic IP assigned (optional but recommended)
- [ ] SSH key pair (.pem file) downloaded and secured
- [ ] Can SSH into instance: `ssh -i key.pem ubuntu@EC2_IP`

### Software Installation on EC2

- [ ] System updated: `sudo apt update && sudo apt upgrade -y`
- [ ] Node.js 20+ installed
- [ ] npm available
- [ ] PM2 installed globally: `sudo npm install -g pm2`
- [ ] Nginx installed: `sudo apt install nginx`
- [ ] Git installed: `sudo apt install git`
- [ ] Project directory created: `/var/www/newborn-nest`
- [ ] Correct ownership: `sudo chown -R $USER:$USER /var/www/newborn-nest`

### Project Setup on EC2

- [ ] Code pulled from git or uploaded via SCP
- [ ] Project location: `/var/www/newborn-nest`
- [ ] Nginx configured (config file in `/etc/nginx/sites-available/`)
- [ ] Nginx config symlinked to `/etc/nginx/sites-enabled/`
- [ ] Nginx config tested: `sudo nginx -t`
- [ ] Nginx reloaded: `sudo systemctl reload nginx`

## Deployment Execution Checklist

### Running the Fix Script

- [ ] SSH to EC2: `ssh -i key.pem ubuntu@EC2_IP`
- [ ] Navigate to project: `cd /var/www/newborn-nest`
- [ ] Script is executable: `chmod +x deployment_script/fix-frontend-backend-connection.sh`
- [ ] Run script: `./deployment_script/fix-frontend-backend-connection.sh`
- [ ] Script completed without errors
- [ ] No red error messages in output

### Script Completion Verification

- [ ] Frontend `.env.production` created
- [ ] Backend `.env` configured with correct CORS
- [ ] Backend data directory exists: `backend/data`
- [ ] Dependencies installed (frontend and backend)
- [ ] Frontend built successfully (`dist/` directory exists)
- [ ] Build verified (no localhost references)
- [ ] Backend restarted with PM2
- [ ] Nginx reloaded

## Post-Deployment Verification

### Backend Testing (On EC2)

```bash
# All these should return success/OK responses
```

- [ ] PM2 shows backend running: `pm2 list`
- [ ] Backend health check: `curl http://localhost:5000/api/health`
- [ ] Backend responds with JSON: `{"status":"ok",...}`
- [ ] Nginx is running: `sudo systemctl status nginx`
- [ ] No errors in backend logs: `pm2 logs newborn-nest-api --lines 50`
- [ ] No errors in nginx logs: `sudo tail -50 /var/log/nginx/error.log`

### Frontend Testing (In Browser)

- [ ] Open: `http://YOUR_EC2_IP`
- [ ] Page loads successfully (not blank or error)
- [ ] No white screen of death
- [ ] No "Cannot connect to server" messages

### Browser Developer Console (F12)

**Console Tab:**
- [ ] No CORS errors
- [ ] No "Failed to fetch" errors
- [ ] No "localhost:5000" references
- [ ] No 404 errors for /api endpoints
- [ ] No 502 Bad Gateway errors

**Network Tab:**
- [ ] API requests go to `/api/patients` (not `localhost:5000`)
- [ ] API responses have status 200 OK
- [ ] GET `/api/patients` works
- [ ] POST `/api/patients` works (when creating patient)

### Feature Testing

- [ ] **View Patient List:**
  - [ ] Can see patient list page
  - [ ] No errors loading patients
  - [ ] Search works (if applicable)

- [ ] **Create New Patient:**
  - [ ] Can open "Add Patient" dialog
  - [ ] Form validation works
  - [ ] Can fill in patient details
  - [ ] Can submit form
  - [ ] Success message appears
  - [ ] Patient appears in list
  - [ ] No console errors

- [ ] **Upload Images:**
  - [ ] Can click "Take Photo"
  - [ ] Camera interface opens
  - [ ] Can switch front/back camera
  - [ ] Can capture photo
  - [ ] Photo auto-uploads (after fix)
  - [ ] Can see uploaded image
  - [ ] Can upload from file (Browse)
  - [ ] Can delete image
  - [ ] All 4 image types work (face, ear, foot, palm)

- [ ] **View Patient Details:**
  - [ ] Can click on a patient
  - [ ] Detail page loads
  - [ ] Can see patient information
  - [ ] Can see uploaded images
  - [ ] Can update patient info
  - [ ] Can add/update assessments

- [ ] **Image Display:**
  - [ ] Uploaded images display correctly
  - [ ] Images load from `/uploads/` path
  - [ ] No broken image icons
  - [ ] Images are correct size/resolution

### Performance Testing

- [ ] Page loads in under 3 seconds
- [ ] Image uploads complete reasonably fast
- [ ] No significant lag when navigating
- [ ] Camera capture is responsive

### Configuration Verification

```bash
# Run these commands on EC2 to verify configuration
```

- [ ] Frontend config correct:
  ```bash
  cat .env.production
  # Should show: VITE_API_URL=/api
  ```

- [ ] Backend config correct:
  ```bash
  cat backend/.env | grep CORS
  # Should show: CORS_ORIGIN=http://YOUR_EC2_IP
  ```

- [ ] Build is clean:
  ```bash
  grep -r "localhost:5000" dist/ || echo "Clean"
  # Should show: Clean
  ```

- [ ] Data directory permissions:
  ```bash
  ls -ld backend/data
  # Should show: drwxr-xr-x (755)
  ```

## Post-Deployment Setup

### PM2 Startup (Run Once)

- [ ] Setup PM2 to start on boot:
  ```bash
  pm2 startup systemd
  # Follow the command it outputs
  pm2 save
  ```

### SSL Certificate (Optional but Recommended)

- [ ] Domain name pointed to EC2 IP (if using domain)
- [ ] Certbot installed: `sudo apt install certbot python3-certbot-nginx`
- [ ] SSL certificate obtained: `sudo certbot --nginx -d yourdomain.com`
- [ ] Auto-renewal tested: `sudo certbot renew --dry-run`
- [ ] Site accessible via HTTPS: `https://yourdomain.com`

### Backup Strategy

- [ ] Backup script created (optional)
- [ ] First manual backup taken:
  ```bash
  cd /var/www/newborn-nest/backend
  tar -czf ~/backup-$(date +%Y%m%d).tar.gz data/
  ```
- [ ] Backup downloaded to local machine (optional):
  ```bash
  scp -i key.pem ubuntu@EC2_IP:~/backup-*.tar.gz ./
  ```

### Monitoring Setup (Optional)

- [ ] CloudWatch alarms configured
- [ ] Disk usage monitoring enabled
- [ ] PM2 monitoring: `pm2 monitor` (optional)

## Troubleshooting Checks

If something doesn't work, verify:

### Connection Issues

- [ ] EC2 security group allows HTTP (80) from anywhere
- [ ] Nginx is listening on port 80: `sudo netstat -tlnp | grep :80`
- [ ] Backend is listening on port 5000: `sudo netstat -tlnp | grep :5000`
- [ ] No firewall blocking: `sudo ufw status` (should be inactive or allow 80/443)

### CORS Issues

- [ ] Backend CORS matches EC2 IP exactly
- [ ] No trailing slash in CORS_ORIGIN
- [ ] Backend restarted after CORS change
- [ ] Browser console shows the actual request origin

### Image Upload Issues

- [ ] Data directory exists: `ls -la backend/data`
- [ ] Data directory is writable: `touch backend/data/test.txt && rm backend/data/test.txt`
- [ ] Nginx config includes `/uploads` location block
- [ ] Max upload size configured in nginx: `client_max_body_size 10M`

### Build Issues

- [ ] Node version is 20+: `node --version`
- [ ] .env.production exists in project root
- [ ] Built with NODE_ENV=production
- [ ] No localhost in build: `grep -r localhost dist/`

## Regular Maintenance Checklist

### Weekly

- [ ] Check disk space: `df -h`
- [ ] Check backend logs for errors: `pm2 logs --lines 100`
- [ ] Review nginx access logs: `sudo tail -100 /var/log/nginx/access.log`
- [ ] Verify backup size is reasonable

### Monthly

- [ ] Update system packages: `sudo apt update && sudo apt upgrade`
- [ ] Update npm packages: `npm outdated`
- [ ] Rotate logs if needed
- [ ] Review and clean old backups

### After Each Deployment

- [ ] Test all features (use Feature Testing section above)
- [ ] Check for console errors
- [ ] Verify images still load correctly
- [ ] Create backup before major changes

## Rollback Plan

If deployment fails:

- [ ] Keep previous backup ready
- [ ] Document what went wrong
- [ ] Restore previous .env files from backup
- [ ] Rebuild with previous configuration:
  ```bash
  NODE_ENV=production npm run build
  pm2 restart newborn-nest-api
  ```
- [ ] Verify restoration with browser tests

## Success Criteria

Deployment is successful when ALL of these are true:

✓ Script completed without errors
✓ Frontend loads in browser at `http://EC2_IP`
✓ No CORS errors in browser console
✓ Can create new patient successfully
✓ Can upload images (all 4 types)
✓ Images display correctly
✓ Backend health check returns OK
✓ PM2 shows backend running
✓ Nginx shows active/running

## Quick Reference Commands

```bash
# SSH to EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Navigate to project
cd /var/www/newborn-nest

# Run deployment script
./deployment_script/fix-frontend-backend-connection.sh

# Quick checks
pm2 list                                    # Check backend
curl http://localhost:5000/api/health       # Test backend
sudo systemctl status nginx                 # Check nginx
grep -r "localhost:5000" dist/              # Verify build

# View logs
pm2 logs newborn-nest-api
sudo tail -f /var/log/nginx/error.log

# Restart services
pm2 restart newborn-nest-api
sudo systemctl reload nginx

# Emergency stop
pm2 stop newborn-nest-api
sudo systemctl stop nginx
```

## Notes

- Date of deployment: _______________
- EC2 IP: _______________
- Domain (if any): _______________
- Issues encountered: _______________
- Resolution: _______________

---

**Keep this checklist for future deployments and reference!**
