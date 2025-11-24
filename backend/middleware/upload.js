import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists (at project root)
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // We'll create patient-specific folders in the route handler
    cb(null, dataDir);
  },
  filename: function (req, file, cb) {
    // Generate temporary filename, will be renamed in route handler
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'temp-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and GIF images are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880') // 5MB default
  },
  fileFilter: fileFilter
});

// Multiple images upload configuration
export const uploadPatientImages = upload.fields([
  { name: 'face', maxCount: 1 },
  { name: 'ear', maxCount: 1 },
  { name: 'foot', maxCount: 1 },
  { name: 'palm', maxCount: 1 }
]);

// Single image upload
export const uploadSingleImage = upload.single('image');

// Error handling middleware for multer
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: `File size exceeds the maximum limit of ${process.env.MAX_FILE_SIZE || '5MB'}`
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Too many files',
        message: 'Maximum 1 file per image type allowed'
      });
    }
    return res.status(400).json({
      error: 'Upload error',
      message: err.message
    });
  }

  if (err) {
    return res.status(400).json({
      error: 'File upload error',
      message: err.message
    });
  }

  next();
};
