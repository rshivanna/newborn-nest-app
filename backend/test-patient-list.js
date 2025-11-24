/**
 * Test patient listing functionality
 * Run with: node test-patient-list.js
 */

import { listPatientFolders, readPatientData } from './utils/fileHandler.js';

console.log('Testing patient listing functionality...\n');

// Test 1: List all patient folders
console.log('1. Listing patient folders...');
const folders = listPatientFolders();
console.log(`   Found ${folders.length} patient folder(s)\n`);

if (folders.length === 0) {
  console.log('   ⚠️  No patients found!');
  console.log('   Run: node create-sample-patients.js to create sample data\n');
  process.exit(0);
}

// Test 2: Read patient data from each folder
console.log('2. Reading patient data...\n');
const patients = [];

folders.forEach((folderName, index) => {
  const patientData = readPatientData(folderName);
  if (patientData) {
    patients.push(patientData);
    console.log(`   ✅ Patient ${index + 1}:`);
    console.log(`      Name: ${patientData.babyName}`);
    console.log(`      Mother: ${patientData.motherName}`);
    console.log(`      ID: ${patientData.id}`);
    console.log(`      Folder: ${patientData.folderName}`);
    console.log(`      Created: ${patientData.createdAt}\n`);
  } else {
    console.log(`   ❌ Failed to read: ${folderName}\n`);
  }
});

// Test 3: Sort by creation date (newest first)
console.log('3. Sorting patients by creation date...');
patients.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
console.log('   ✅ Sorted!\n');

// Test 4: Display summary
console.log('4. Summary:');
console.log(`   Total patients: ${patients.length}`);
console.log(`   Patient names:`);
patients.forEach((p, i) => {
  console.log(`      ${i + 1}. ${p.babyName} (${new Date(p.createdAt).toLocaleDateString()})`);
});

console.log('\n✅ Patient listing test completed!');
console.log('\nThese patients should appear in the frontend when you:');
console.log('1. Start backend: npm start');
console.log('2. Start frontend: npm run dev (in root directory)');
console.log('3. Open http://localhost:8080\n');
