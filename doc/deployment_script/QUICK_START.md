# Quick Start - EC2 Deployment Fix

Ultra-simple guide to fix frontend-backend connection on EC2.

## One-Command Fix

SSH to your EC2 instance and run:

```bash
cd /var/www/newborn-nest && \
chmod +x deployment_script/fix-frontend-backend-connection.sh && \
./deployment_script/fix-frontend-backend-connection.sh
```

That's it! The script will:
- Auto-detect your EC2 IP
- Create all necessary config files
- Build frontend correctly
- Restart all services
- Test everything

## Verification (30 seconds)

1. Open browser: `http://YOUR_EC2_IP`
2. Press F12 → Console tab
3. Look for errors:
   - ✓ No CORS errors = Working!
   - ✗ CORS errors = See troubleshooting below

4. Test create patient:
   - Click "Add Patient"
   - Fill in details
   - Click Save
   - ✓ Success message = Working!

## If It Doesn't Work

### Still seeing localhost errors?

```bash
# On EC2, verify .env.production exists
cat /var/www/newborn-nest/.env.production
# Should show: VITE_API_URL=/api

# If missing, create it:
echo "VITE_API_URL=/api" > .env.production

# Rebuild:
NODE_ENV=production npm run build
pm2 restart newborn-nest-api
```

### CORS errors?

```bash
# Check backend CORS config
cat /var/www/newborn-nest/backend/.env | grep CORS

# Should match your EC2 IP
# If wrong, edit it:
nano /var/www/newborn-nest/backend/.env
# Change CORS_ORIGIN=http://YOUR_ACTUAL_EC2_IP

# Restart backend
pm2 restart newborn-nest-api
```

### 502 Bad Gateway?

```bash
# Check if backend is running
pm2 list

# If not running, start it
pm2 restart newborn-nest-api

# Check logs
pm2 logs newborn-nest-api
```

## Files in This Directory

| File | Purpose |
|------|---------|
| `fix-frontend-backend-connection.sh` | Main fix script (automatic) |
| `quick-deploy.sh` | Quick updates after first deployment |
| `README.md` | Detailed documentation |
| `DEPLOYMENT_CHECKLIST.md` | Complete checklist for deployment |
| `QUICK_START.md` | This file |

## Next Steps After Fix

1. **Test all features** (see DEPLOYMENT_CHECKLIST.md)
2. **Setup SSL** (optional):
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```
3. **Setup PM2 startup**:
   ```bash
   pm2 startup systemd
   pm2 save
   ```
4. **Create backup**:
   ```bash
   cd /var/www/newborn-nest/backend
   tar -czf ~/backup-$(date +%Y%m%d).tar.gz data/
   ```

## Future Updates

When you need to deploy updates:

```bash
# Use the quick deploy script
cd /var/www/newborn-nest
./deployment_script/quick-deploy.sh
```

This will:
- Pull latest code
- Install dependencies
- Rebuild frontend
- Restart services

## Help

- Detailed docs: `README.md`
- Complete checklist: `DEPLOYMENT_CHECKLIST.md`
- Troubleshooting: `../doc/frontend-backend-connection-fix.md`

## Emergency Contacts

If nothing works:

1. Check backend logs: `pm2 logs newborn-nest-api`
2. Check nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Restart everything:
   ```bash
   pm2 restart all
   sudo systemctl restart nginx
   ```
4. Review main docs: `../doc/frontend-backend-connection-fix.md`
