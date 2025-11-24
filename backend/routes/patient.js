import express from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { uploadPatientImages, handleMulterError } from '../middleware/upload.js';
import {
  generateFolderName,
  createPatientFolder,
  savePatientJSON,
  moveAndRenameImage,
  deleteOldImage,
  readPatientData,
  listPatientFolders,
  deletePatientFolder
} from '../utils/fileHandler.js';

const router = express.Router();

/**
 * Validation rules for patient creation
 */
const patientValidationRules = [
  body('babyName').trim().notEmpty().withMessage('Baby name is required'),
  body('motherName').trim().notEmpty().withMessage('Mother name is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('babyDetails.gestationalAge').optional().isNumeric(),
  body('babyDetails.weightKg').optional().isFloat({ min: 0 }),
  body('babyDetails.sex').optional().isIn(['male', 'female', 'other']),
  body('babyDetails.heartRateBpm').optional().isInt({ min: 0, max: 300 }),
  body('babyDetails.temperatureC').optional().isFloat({ min: 30, max: 45 }),
  body('maternalDetails.maternalAgeYears').optional().isInt({ min: 0, max: 150 }),
  body('maternalDetails.location').optional().trim(),
  body('maternalDetails.maternalEducation').optional().trim(),
  body('maternalDetails.deliveryMode').optional().isIn(['normal', 'cesarean', 'assisted']),
];

/**
 * POST /api/patients
 * Create a new patient record with images
 */
router.post(
  '/',
  uploadPatientImages,
  handleMulterError,
  patientValidationRules,
  async (req, res, next) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Extract patient data from request body
      const {
        babyName,
        motherName,
        address,
        babyDetails = {},
        maternalDetails = {}
      } = req.body;

      // Generate unique ID and folder name
      const patientId = uuidv4();
      const folderName = generateFolderName(babyName);

      // Create patient folder
      const folderPath = createPatientFolder(folderName);

      // Process uploaded images
      const images = {};
      const imageTypes = ['face', 'ear', 'foot', 'palm'];

      if (req.files) {
        for (const imageType of imageTypes) {
          if (req.files[imageType] && req.files[imageType][0]) {
            const file = req.files[imageType][0];
            const extension = path.extname(file.originalname);

            // Move and rename image
            const newPath = moveAndRenameImage(
              file.path,
              folderPath,
              folderName,
              imageType,
              extension
            );

            // Store relative path for JSON
            images[imageType] = path.basename(newPath);
          }
        }
      }

      // Extract assessments if provided
      const assessments = req.body.assessments || {};

      // Prepare patient data object
      const patientData = {
        id: patientId,
        babyName,
        motherName,
        address,
        babyDetails: {
          gestationalAge: babyDetails.gestationalAge || '',
          weightKg: parseFloat(babyDetails.weightKg) || null,
          sex: babyDetails.sex || '',
          heartRateBpm: parseInt(babyDetails.heartRateBpm) || null,
          temperatureC: parseFloat(babyDetails.temperatureC) || null
        },
        maternalDetails: {
          maternalAgeYears: parseInt(maternalDetails.maternalAgeYears) || null,
          parity: maternalDetails.parity || '',
          location: maternalDetails.location || '',
          maternalEducation: maternalDetails.maternalEducation || '',
          deliveryMode: maternalDetails.deliveryMode || '',
          gestationalHistory: maternalDetails.gestationalHistory || '',
          gestationalAgeEstimationMethod: maternalDetails.gestationalAgeEstimationMethod || ''
        },
        assessments: {
          face: assessments.face || '',
          ear: assessments.ear || '',
          foot: assessments.foot || '',
          palm: assessments.palm || ''
        },
        images,
        folderName,
        folderPath,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save JSON file
      savePatientJSON(folderPath, folderName, patientData);

      // Send response
      res.status(201).json({
        success: true,
        message: 'Patient created successfully',
        data: patientData
      });
    } catch (error) {
      console.error('Error creating patient:', error);
      next(error);
    }
  }
);

/**
 * GET /api/patients
 * Get all patients
 */
router.get('/', async (req, res, next) => {
  try {
    const folders = listPatientFolders();
    const patients = [];

    for (const folderName of folders) {
      const patientData = readPatientData(folderName);
      if (patientData) {
        patients.push(patientData);
      }
    }

    // Sort by creation date (newest first)
    patients.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      count: patients.length,
      data: patients
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    next(error);
  }
});

/**
 * GET /api/patients/:id
 * Get a single patient by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const folders = listPatientFolders();

    let foundPatient = null;
    for (const folderName of folders) {
      const patientData = readPatientData(folderName);
      if (patientData && patientData.id === id) {
        foundPatient = patientData;
        break;
      }
    }

    if (!foundPatient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.json({
      success: true,
      data: foundPatient
    });
  } catch (error) {
    console.error('Error fetching patient:', error);
    next(error);
  }
});

/**
 * PUT /api/patients/:id
 * Update a patient record
 */
router.put('/:id', uploadPatientImages, handleMulterError, async (req, res, next) => {
  try {
    const { id } = req.params;
    const folders = listPatientFolders();

    let patientFolder = null;
    for (const folderName of folders) {
      const patientData = readPatientData(folderName);
      if (patientData && patientData.id === id) {
        patientFolder = folderName;
        break;
      }
    }

    if (!patientFolder) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Read existing data
    const existingData = readPatientData(patientFolder);

    // Regenerate folderPath dynamically (don't use stored path - could be from different OS)
    const folderPath = createPatientFolder(patientFolder);

    // Update patient data
    const updatedData = {
      ...existingData,
      ...req.body,
      id: existingData.id, // Preserve original ID
      folderName: existingData.folderName, // Preserve folder name
      folderPath: folderPath, // Use dynamically computed path (not stored path)
      updatedAt: new Date().toISOString()
    };

    // Handle assessments if provided
    if (req.body.assessments) {
      updatedData.assessments = {
        ...existingData.assessments,
        ...req.body.assessments
      };
    }

    // Process new uploaded images if any
    if (req.files) {
      const imageTypes = ['face', 'ear', 'foot', 'palm'];
      for (const imageType of imageTypes) {
        if (req.files[imageType] && req.files[imageType][0]) {
          const file = req.files[imageType][0];
          const extension = path.extname(file.originalname);

          console.log(`[INFO] Uploading ${imageType} image for patient ${id}`);

          // Delete old image if it exists
          if (existingData.images && existingData.images[imageType]) {
            console.log(`[INFO] Deleting old ${imageType} image: ${existingData.images[imageType]}`);
            deleteOldImage(folderPath, existingData.images[imageType]);
          }

          const newPath = moveAndRenameImage(
            file.path,
            folderPath,
            patientFolder,
            imageType,
            extension
          );

          updatedData.images[imageType] = path.basename(newPath);
          console.log(`[INFO] Successfully uploaded ${imageType} image: ${path.basename(newPath)}`);
        }
      }
    }

    // Save updated JSON
    savePatientJSON(folderPath, patientFolder, updatedData);

    res.json({
      success: true,
      message: 'Patient updated successfully',
      data: updatedData
    });
  } catch (error) {
    console.error('[ERROR] Error updating patient:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update patient',
      error: error.message
    });
  }
});

/**
 * DELETE /api/patients/:id/images/:imageType
 * Delete a specific image from a patient record
 */
router.delete('/:id/images/:imageType', async (req, res, next) => {
  try {
    const { id, imageType } = req.params;
    const validImageTypes = ['face', 'ear', 'foot', 'palm'];

    if (!validImageTypes.includes(imageType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image type. Must be one of: face, ear, foot, palm'
      });
    }

    const folders = listPatientFolders();
    let patientFolder = null;
    for (const folderName of folders) {
      const patientData = readPatientData(folderName);
      if (patientData && patientData.id === id) {
        patientFolder = folderName;
        break;
      }
    }

    if (!patientFolder) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Read existing data
    const existingData = readPatientData(patientFolder);

    // Regenerate folderPath dynamically (don't use stored path - could be from different OS)
    const folderPath = createPatientFolder(patientFolder);

    // Delete the image file if it exists
    if (existingData.images && existingData.images[imageType]) {
      deleteOldImage(folderPath, existingData.images[imageType]);

      // Update patient data to remove the image reference
      const updatedData = {
        ...existingData,
        images: {
          ...existingData.images,
          [imageType]: null
        },
        updatedAt: new Date().toISOString()
      };

      // Remove null values from images object
      Object.keys(updatedData.images).forEach(key => {
        if (updatedData.images[key] === null) {
          delete updatedData.images[key];
        }
      });

      // Save updated JSON
      savePatientJSON(folderPath, patientFolder, updatedData);

      res.json({
        success: true,
        message: `${imageType} image deleted successfully`,
        data: updatedData
      });
    } else {
      return res.status(404).json({
        success: false,
        message: `No ${imageType} image found for this patient`
      });
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    next(error);
  }
});

/**
 * DELETE /api/patients/:id
 * Delete a patient record
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const folders = listPatientFolders();

    let patientFolder = null;
    for (const folderName of folders) {
      const patientData = readPatientData(folderName);
      if (patientData && patientData.id === id) {
        patientFolder = folderName;
        break;
      }
    }

    if (!patientFolder) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Delete patient folder
    const deleted = deletePatientFolder(patientFolder);

    if (deleted) {
      res.json({
        success: true,
        message: 'Patient deleted successfully'
      });
    } else {
      throw new Error('Failed to delete patient folder');
    }
  } catch (error) {
    console.error('Error deleting patient:', error);
    next(error);
  }
});

export default router;
