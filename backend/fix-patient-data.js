/**
 * Fix patient data - remove fake image references
 */
import { listPatientFolders, readPatientData, savePatientJSON } from './utils/fileHandler.js';

const folders = listPatientFolders();
console.log('Fixing patient data...\n');

folders.forEach(folderName => {
  const patient = readPatientData(folderName);
  if (patient) {
    // Clear fake image references
    patient.images = {};
    const folderPath = patient.folderPath;
    savePatientJSON(folderPath, folderName, patient);
    console.log(`✅ Fixed: ${patient.babyName} - Images cleared`);
  }
});

console.log('\n✅ All patient data fixed!');
console.log('Patients now have empty images - you can upload photos through the app.\n');
