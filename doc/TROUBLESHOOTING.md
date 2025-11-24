# Troubleshooting Guide

## Patient Data Not Saving

If patients are not being saved when clicking "Add Patient", follow these steps:

### 1. Verify Backend is Running

Check if the backend server is running:

```bash
# You should see backend running on port 5000
# In browser or curl:
curl http://localhost:5000/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "environment": "development",
  "timestamp": "2025-11-19T..."
}
```

### 2. Check Data Folder Exists

```bash
# From project root
ls -la data/

# If it doesn't exist, create it:
mkdir data
```

### 3. Verify Data Folder Permissions

```bash
# Make sure the folder is writable
# On Windows: Check folder properties
# On Linux/Mac:
chmod 755 data/
```

### 4. Check Backend Logs

Look for errors in the backend terminal:

```bash
cd backend
npm start
```

Watch for:
- ✅ `Server running in development mode on port 5000`
- ✅ `Data directory: /path/to/data`
- ❌ Any error messages about file permissions
- ❌ Any error messages about ENOENT (no such file or directory)

### 5. Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Try adding a patient
4. Look for errors:
   - ❌ Network errors (404, 500)
   - ❌ CORS errors
   - ❌ Failed to fetch

### 6. Check Network Tab

1. Open DevTools → Network tab
2. Click "Add Patient"
3. Look for POST request to `/api/patients`
4. Check:
   - Status should be `201 Created`
   - Response should contain patient data
   - If 400/500, check response error message

### 7. Verify Environment Variables

Check `backend/.env`:

```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:8080
MAX_FILE_SIZE=5242880
UPLOAD_DIR=../data
API_PREFIX=/api
```

### 8. Test Backend Directly

Use curl or Postman to test the API directly:

```bash
# Test health endpoint
curl http://localhost:5000/api/health

# Test GET patients
curl http://localhost:5000/api/patients

# Test POST patient (without images)
curl -X POST http://localhost:5000/api/patients \
  -H "Content-Type: application/json" \
  -d '{
    "babyName": "Test Baby",
    "motherName": "Test Mother",
    "address": "123 Test St",
    "babyDetails": {
      "gestationalAge": "38"
    },
    "maternalDetails": {}
  }'
```

### 9. Clear Browser Cache

Sometimes old JavaScript files are cached:

1. Press Ctrl+Shift+Delete
2. Clear cached files
3. Reload page with Ctrl+F5

### 10. Restart Both Servers

```bash
# Stop both servers (Ctrl+C)
# Then restart:

# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
npm run dev
```

## Common Error Messages

### "Failed to create patient"

**Cause:** Backend API error or validation failure

**Solution:**
- Check backend logs for detailed error
- Verify all required fields are filled (babyName, motherName, address, gestationalAge)
- Check field validation (e.g., age ranges, numeric values)

### "Network Error" or "Failed to fetch"

**Cause:** Backend not running or CORS issue

**Solution:**
- Verify backend is running on port 5000
- Check CORS_ORIGIN in backend/.env matches frontend URL
- Restart both servers

### "ENOENT: no such file or directory"

**Cause:** Data folder doesn't exist or wrong path

**Solution:**
- Create data folder at project root: `mkdir data`
- Verify UPLOAD_DIR in backend/.env is `../data`
- Check file permissions

### "MulterError: File too large"

**Cause:** Image file exceeds size limit

**Solution:**
- Default limit is 5MB
- Reduce image size before uploading
- Or increase MAX_FILE_SIZE in backend/.env

### "Invalid file type"

**Cause:** Trying to upload non-image file

**Solution:**
- Only JPEG, PNG, and GIF images are allowed
- Check file extension and MIME type

## Quick Diagnostic Script

Run the backend test script:

```bash
cd backend
node test-api.js
```

This will verify:
- Data directory exists
- Write permissions are correct
- File handler utilities work

## Still Having Issues?

### Check Ports

Make sure ports 5000 (backend) and 8080 (frontend) are not in use:

**Windows:**
```bash
netstat -ano | findstr :5000
netstat -ano | findstr :8080
```

**Linux/Mac:**
```bash
lsof -i :5000
lsof -i :8080
```

### Reinstall Dependencies

```bash
# Remove node_modules
rm -rf node_modules backend/node_modules

# Reinstall
npm install
cd backend && npm install
```

### Check Node Version

```bash
node --version
# Should be 20.x or higher
```

## Enable Debug Mode

For more detailed logging:

1. Edit `backend/server.js`
2. Add at the top:
```javascript
import debug from 'debug';
const log = debug('app:server');
```

3. Run with debug:
```bash
DEBUG=app:* npm start
```

## Data Verification

After adding a patient, verify data was saved:

```bash
# Check if patient folder was created
ls -la data/

# Check patient data file
cat data/patient_name_12345678/patient_name_12345678.json
```

## Contact Support

If none of these solutions work:

1. Check the GitHub issues
2. Create a new issue with:
   - Error messages from console
   - Backend logs
   - Browser DevTools screenshots
   - Node.js version
   - Operating system
