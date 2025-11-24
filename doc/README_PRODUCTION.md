# Newborn Nest - Production-Ready Full-Stack Application

A production-ready patient management system for collecting newborn gestation age estimation data, featuring medical image capture and comprehensive patient records.

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **TanStack Query** (React Query) for data fetching
- **shadcn/ui** + Tailwind CSS for UI components
- **React Router** for navigation
- **Zod** for form validation

### Backend
- **Node.js 20+** with Express
- **Multer** for file uploads
- **Express Validator** for input validation
- **File-based storage** (JSON + images)

### Deployment
- **AWS EC2** for hosting
- **Nginx** as reverse proxy
- **PM2** for process management
- **Docker** support (optional)

## 📁 Project Structure

```
newborn-nest-app/
├── backend/                 # Node.js/Express backend
│   ├── routes/             # API route handlers
│   ├── middleware/         # Custom middleware (upload, error handling)
│   ├── utils/              # Utility functions (file operations)
│   ├── data/               # Patient data storage (JSON + images)
│   ├── server.js           # Express server entry point
│   ├── package.json        # Backend dependencies
│   └── .env.example        # Environment variables template
├── src/                    # React frontend source
│   ├── components/         # React components
│   ├── pages/              # Page components
│   ├── services/           # API service layer
│   ├── hooks/              # Custom React hooks
│   └── lib/                # Utilities
├── dist/                   # Frontend production build (generated)
├── public/                 # Static assets
├── DEPLOYMENT.md          # Detailed deployment guide
├── docker-compose.yml     # Docker Compose configuration
├── Dockerfile             # Docker image definition
└── package.json           # Frontend dependencies
```

## 🔧 Development Setup

### Prerequisites

- Node.js 20+ and npm
- Git

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd newborn-nest-app
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Configure Environment Variables

#### Backend (.env)

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:8080
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./data
API_PREFIX=/api
```

#### Frontend (.env.development)

Already configured at root:

```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Run Development Servers

```bash
# Terminal 1: Start backend
cd backend
npm run dev
# Backend runs on http://localhost:5000

# Terminal 2: Start frontend
npm run dev
# Frontend runs on http://localhost:8080
```

### 5. Access Application

Open http://localhost:8080 in your browser

## 📊 Patient Data Structure

### Patient Record (JSON)

```json
{
  "id": "uuid-v4",
  "babyName": "Baby Name",
  "motherName": "Mother Name",
  "address": "Full Address",
  "babyDetails": {
    "gestationalAge": "38",
    "weightKg": 3.5,
    "sex": "male",
    "heartRateBpm": 140,
    "temperatureC": 36.5
  },
  "maternalDetails": {
    "maternalAgeYears": 28,
    "parity": "p1",
    "location": "Hospital Name",
    "maternalEducation": "High School",
    "deliveryMode": "normal",
    "gestationalHistory": "Notes...",
    "gestationalAgeEstimationMethod": "Ultra sound"
  },
  "images": {
    "face": "sam_20079576_face.jpg",
    "ear": "sam_20079576_ear.jpg",
    "foot": "sam_20079576_foot.jpg",
    "palm": "sam_20079576_palm.jpg"
  },
  "folderName": "sam_20079576",
  "folderPath": "/path/to/data/sam_20079576",
  "createdAt": "2025-11-19T17:57:33.362Z",
  "updatedAt": "2025-11-19T17:57:33.362Z"
}
```

### File Storage

```
backend/data/
  └── sam_20079576/              # Patient folder
      ├── sam_20079576.json      # Patient data
      ├── sam_20079576_face.jpg  # Face photo
      ├── sam_20079576_ear.jpg   # Ear photo
      ├── sam_20079576_foot.jpg  # Foot photo
      └── sam_20079576_palm.jpg  # Palm photo
```

## 🏗️ Production Build

### Build Frontend

```bash
npm run build
# Creates optimized build in dist/
```

### Build for Development

```bash
npm run build:dev
# Creates development build with source maps
```

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build
```

Access application at http://localhost:80

### Using Docker Only

```bash
# Build image
docker build -t newborn-nest .

# Run container
docker run -d \
  -p 5000:5000 \
  -v $(pwd)/backend/data:/app/backend/data \
  -e NODE_ENV=production \
  --name newborn-nest-app \
  newborn-nest
```

## ☁️ AWS EC2 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment instructions including:

- EC2 instance setup
- Nginx configuration
- PM2 process management
- SSL certificate setup
- Security best practices

### Quick Deployment Summary

1. **Launch EC2 Instance** (Ubuntu 22.04, t2.small+)
2. **Install Dependencies**: Node.js, Nginx, PM2
3. **Clone & Build**: Clone repo, build frontend
4. **Configure Services**: Setup Nginx reverse proxy
5. **Start Application**: Use PM2 for process management
6. **Setup SSL**: Use Let's Encrypt for HTTPS

## 🔌 API Endpoints

### Patients

```bash
# Get all patients
GET /api/patients

# Get single patient
GET /api/patients/:id

# Create patient
POST /api/patients
Content-Type: multipart/form-data
# Body: patient data + image files

# Update patient
PUT /api/patients/:id
Content-Type: multipart/form-data

# Delete patient
DELETE /api/patients/:id
```

### Health Check

```bash
GET /api/health
```

## 🔐 Security Features

- **Helmet.js** for security headers
- **CORS** protection
- **Input validation** with express-validator
- **File type validation** (images only)
- **File size limits** (5MB default)
- **Sanitized filenames**
- **Error handling** middleware
- **Request logging** with Morgan

## 🧪 Testing

```bash
# Backend tests (to be implemented)
cd backend
npm test

# Frontend tests (to be implemented)
npm test
```

## 📝 Common Development Tasks

### Adding New Patient Fields

1. Update `src/services/api.ts` interfaces
2. Update backend validation in `backend/routes/patient.js`
3. Update frontend form in `src/components/PatientDialog.tsx`

### Changing File Upload Limits

Edit `backend/.env`:
```env
MAX_FILE_SIZE=10485760  # 10MB in bytes
```

### Adding New Image Types

1. Update `PatientData` interface in `src/services/api.ts`
2. Update multer fields in `backend/middleware/upload.js`
3. Add UI component in `src/pages/PatientDetail.tsx`

## 🐛 Troubleshooting

### Backend Won't Start

```bash
# Check if port is in use
lsof -i :5000

# Check logs
npm run dev
```

### Frontend Can't Connect to Backend

- Verify backend is running on port 5000
- Check CORS settings in `backend/server.js`
- Verify `VITE_API_URL` in `.env.development`

### Images Not Uploading

- Check `backend/data` folder permissions
- Verify `MAX_FILE_SIZE` setting
- Check file type (must be image/*)
- Review Nginx `client_max_body_size` if deployed

### Database Errors

This app uses file-based storage, not a database. Check:
- `backend/data` folder exists and is writable
- Sufficient disk space available

## 📦 Production Checklist

- [ ] Environment variables configured
- [ ] Frontend built with `npm run build`
- [ ] Backend dependencies installed
- [ ] Data directory created with proper permissions
- [ ] Nginx configured and running
- [ ] PM2 process started and saved
- [ ] Firewall rules configured
- [ ] SSL certificate installed
- [ ] Backup strategy implemented
- [ ] Monitoring setup (logs, disk space)

## 🔄 Updates & Maintenance

### Updating Application

```bash
# Pull latest code
git pull origin main

# Rebuild frontend
npm install
npm run build

# Update backend
cd backend
npm install

# Restart services
pm2 restart newborn-nest-api
```

### Backup Data

```bash
# Create backup
cd backend
tar -czf backup-$(date +%Y%m%d).tar.gz data/

# Restore from backup
tar -xzf backup-20250119.tar.gz
```

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [Vite Documentation](https://vitejs.dev/)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Nginx Documentation](https://nginx.org/en/docs/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

[Your License Here]

## 💡 Support

For issues or questions:
- Create an issue in the repository
- Check DEPLOYMENT.md for deployment-specific issues
- Review troubleshooting section above

---

**Note**: This is a production-ready application converted from a Lovable prototype, featuring full-stack architecture with React frontend and Node.js/Express backend.
