import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import https from 'https';
import fs from 'fs';
import { fileURLToPath } from 'url';
import patientRoutes from './routes/patient.js';
import { errorHandler } from './middleware/errorHandler.js';

// ES modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
// Security headers with adjusted CSP for cross-origin images
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "http://localhost:*"],
    },
  },
}));
app.use(morgan('combined')); // Logging

// CORS configuration - allow multiple localhost ports (HTTP and HTTPS)
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow any localhost port in development
    const allowedOrigins = [
      'http://localhost:8080',
      'http://localhost:8081',
      'http://localhost:3000',
      'https://localhost',
      'https://localhost:443',
      process.env.CORS_ORIGIN
    ].filter(Boolean);

    // Check if origin matches localhost pattern (HTTP or HTTPS)
    const localhostPattern = /^https?:\/\/localhost(:\d+)?$/;
    const httpsPattern = /^https:\/\/.+$/;
    if (localhostPattern.test(origin) || httpsPattern.test(origin) || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploaded images (in development)
app.use('/uploads', express.static(path.join(__dirname, '../data')));

// API Routes
app.use('/api/patients', patientRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: NODE_ENV,
    ssl: true,
    timestamp: new Date().toISOString()
  });
});

// Serve React build in production
if (NODE_ENV === 'production') {
  const frontendBuild = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendBuild));

  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendBuild, 'index.html'));
  });
}

// Error handling middleware (must be last)
app.use(errorHandler);

// SSL Configuration - ONLY for direct HTTPS on Node.js (not recommended)
// UPDATE THESE PATHS to your actual SSL certificate locations
const sslOptions = {
  key: fs.readFileSync('/etc/nginx/ssl/key.pem'),
  cert: fs.readFileSync('/etc/nginx/ssl/cert.pem')
};

// Start HTTPS server
https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(`🚀 Server running in ${NODE_ENV} mode on port ${PORT} with SSL`);
  console.log(`📁 Data directory: ${path.join(__dirname, '../data')}`);
  console.log(`🔒 HTTPS enabled - Access via https://52.66.227.191:${PORT}`);
  if (NODE_ENV === 'development') {
    console.log(`🌐 CORS enabled for: ${corsOptions.origin}`);
  }
});
