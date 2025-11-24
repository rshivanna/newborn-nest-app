import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Sanitize filename by removing special characters
 * @param {string} name - Original name
 * @returns {string} - Sanitized name
 */
export const sanitizeFilename = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
};

/**
 * Get data directory path
 * @returns {string} - Full path to data directory
 */
const getDataDir = () => {
  // Data folder is at project root (one level up from backend)
  return path.join(__dirname, '../../data');
};

/**
 * Generate unique folder name for patient
 * @param {string} babyName - Baby's name
 * @returns {string} - Unique folder name
 */
export const generateFolderName = (babyName) => {
  const sanitized = sanitizeFilename(babyName);
  const timestamp = Date.now().toString().slice(-8);
  return `${sanitized}_${timestamp}`;
};

/**
 * Create patient folder
 * @param {string} folderName - Folder name
 * @returns {string} - Full path to created folder
 */
export const createPatientFolder = (folderName) => {
  const dataDir = getDataDir();
  const patientFolder = path.join(dataDir, folderName);

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(patientFolder)) {
    fs.mkdirSync(patientFolder, { recursive: true });
  }

  return patientFolder;
};

/**
 * Save patient JSON data
 * @param {string} folderPath - Path to patient folder
 * @param {string} folderName - Folder name (used for filename)
 * @param {object} data - Patient data object
 * @returns {string} - Path to saved JSON file
 */
export const savePatientJSON = (folderPath, folderName, data) => {
  const jsonPath = path.join(folderPath, `${folderName}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');
  return jsonPath;
};

/**
 * Delete old image file if it exists
 * @param {string} folderPath - Patient folder path
 * @param {string} oldFilename - Old image filename
 */
export const deleteOldImage = (folderPath, oldFilename) => {
  try {
    if (oldFilename) {
      const oldImagePath = path.join(folderPath, oldFilename);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
        console.log(`Deleted old image: ${oldFilename}`);
      }
    }
  } catch (error) {
    console.error('Error deleting old image:', error);
  }
};

/**
 * Move and rename uploaded image
 * @param {string} tempPath - Temporary file path
 * @param {string} folderPath - Destination folder path
 * @param {string} folderName - Base filename
 * @param {string} imageType - Type of image (face, ear, foot, palm)
 * @param {string} extension - File extension
 * @param {boolean} addTimestamp - Whether to add timestamp for uniqueness
 * @returns {string} - New file path
 */
export const moveAndRenameImage = (tempPath, folderPath, folderName, imageType, extension, addTimestamp = true) => {
  // Add timestamp to filename to avoid caching issues and ensure uniqueness
  const timestamp = addTimestamp ? `_${Date.now()}` : '';
  const newFilename = `${folderName}_${imageType}${timestamp}${extension}`;
  const newPath = path.join(folderPath, newFilename);

  fs.renameSync(tempPath, newPath);

  return newPath;
};

/**
 * Read patient data from JSON file
 * @param {string} folderName - Patient folder name
 * @returns {object|null} - Patient data or null if not found
 */
export const readPatientData = (folderName) => {
  try {
    const dataDir = getDataDir();
    const jsonPath = path.join(dataDir, folderName, `${folderName}.json`);

    if (!fs.existsSync(jsonPath)) {
      return null;
    }

    const data = fs.readFileSync(jsonPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading patient data:', error);
    return null;
  }
};

/**
 * List all patient folders
 * @returns {Array<string>} - Array of folder names
 */
export const listPatientFolders = () => {
  try {
    const dataDir = getDataDir();

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      return [];
    }

    return fs.readdirSync(dataDir).filter(item => {
      const itemPath = path.join(dataDir, item);
      return fs.statSync(itemPath).isDirectory();
    });
  } catch (error) {
    console.error('Error listing patient folders:', error);
    return [];
  }
};

/**
 * Delete patient folder and all contents
 * @param {string} folderName - Patient folder name
 * @returns {boolean} - Success status
 */
export const deletePatientFolder = (folderName) => {
  try {
    const dataDir = getDataDir();
    const folderPath = path.join(dataDir, folderName);

    if (fs.existsSync(folderPath)) {
      fs.rmSync(folderPath, { recursive: true, force: true });
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error deleting patient folder:', error);
    return false;
  }
};
