# Quick Start Guide

Get the Newborn Nest application running in under 5 minutes.

## Prerequisites

- Node.js 20+ installed
- npm installed

## Development (Local)

### Option 1: Automated Startup (Recommended)

**Windows:**
```bash
# Double-click or run:
start-dev.bat
```

**Linux/Mac:**
```bash
# Run:
./start-dev.sh
```

This will automatically:
- Install dependencies if needed
- Create data folder if needed
- Start both backend and frontend servers

### Option 2: Manual Startup

### 1. Install Dependencies

```bash
# Install all dependencies
npm install

cd backend
npm install
cd ..
```

### 2. Create Data Folder

```bash
# Create data folder at project root
mkdir data
```

### 3. Setup Backend Environment

The `.env` file is already created with development settings.

To customize, edit `backend/.env`:

```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:8080
MAX_FILE_SIZE=5242880
UPLOAD_DIR=../data
```

### 4. Start Both Servers

```bash
# Terminal 1: Backend
cd backend
npm start
# or for auto-reload: npm run dev

# Terminal 2: Frontend (in project root)
npm run dev
```

### 5. Access the App

Open http://localhost:8080

✅ **Done!** You can now:
- Add new patients
- Upload medical images
- Search and filter patients
- View patient details

## Docker (Production-like)

```bash
# Start with Docker Compose
docker-compose up -d

# Access at http://localhost:80
```

## Test the API

```bash
# Health check
curl http://localhost:5000/api/health

# Get all patients
curl http://localhost:5000/api/patients
```

## Next Steps

- **Deploy to Production**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Full Documentation**: See [README_PRODUCTION.md](./README_PRODUCTION.md)
- **Customize**: Modify patient fields, add features, etc.

## Verify Everything Works

After starting the servers:

1. **Check Backend**: Open http://localhost:5000/api/health
   - Should see: `{"status":"ok",...}`

2. **Check Frontend**: Open http://localhost:8080
   - Should see the Newborn Nest application

3. **Test Patient Creation**:
   - Click "Add New Patient"
   - Fill required fields (Baby Name, Mother Name, Address, Gestational Age)
   - Click "Add Patient"
   - Patient should appear in the list

4. **Verify Data Saved**:
   ```bash
   # Check data folder
   ls -la data/
   # Should see patient folder(s)
   ```

## Common Issues

**Patient Data Not Saving?**

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed solutions.

Quick checks:
- ✅ Backend running on port 5000
- ✅ Data folder exists at project root
- ✅ Both servers restarted after changes

**Port Already in Use?**
```bash
# Change ports in:
# - backend/.env (PORT=5000)
# - vite.config.ts (port: 8080)
```

**Backend Not Starting?**
```bash
# Check Node version
node --version  # Should be 20+

# Clear node_modules
rm -rf node_modules backend/node_modules
npm install
cd backend && npm install
```

**Data Folder Missing?**
```bash
# Create data directory at project root
mkdir data
# On Linux/Mac, set permissions:
chmod 755 data
```

**Run Diagnostic Test**
```bash
cd backend
node test-api.js
# Should pass all tests
```
