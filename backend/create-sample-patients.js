/**
 * Create sample patient data for testing
 * Run with: node create-sample-patients.js
 */

import { v4 as uuidv4 } from 'uuid';
import {
  generateFolderName,
  createPatientFolder,
  savePatientJSON
} from './utils/fileHandler.js';

console.log('Creating sample patient data...\n');

const samplePatients = [
  {
    babyName: 'Emma Johnson',
    motherName: 'Sarah Johnson',
    address: '123 Maple Street, Springfield, IL 62701',
    babyDetails: {
      gestationalAge: '38',
      weightKg: 3.5,
      sex: 'female',
      heartRateBpm: 140,
      temperatureC: 36.5
    },
    maternalDetails: {
      maternalAgeYears: 28,
      parity: 'p1',
      location: 'Springfield Hospital',
      maternalEducation: 'Bachelor\'s Degree',
      deliveryMode: 'normal',
      gestationalHistory: 'First pregnancy, no complications',
      gestationalAgeEstimationMethod: 'Ultra sound'
    }
  },
  {
    babyName: 'Liam Smith',
    motherName: 'Jennifer Smith',
    address: '456 Oak Avenue, Springfield, IL 62702',
    babyDetails: {
      gestationalAge: '39',
      weightKg: 3.8,
      sex: 'male',
      heartRateBpm: 135,
      temperatureC: 36.7
    },
    maternalDetails: {
      maternalAgeYears: 32,
      parity: 'p2',
      location: 'Memorial Hospital',
      maternalEducation: 'High School',
      deliveryMode: 'cesarean',
      gestationalHistory: 'Second pregnancy, previous C-section',
      gestationalAgeEstimationMethod: 'LMB'
    }
  },
  {
    babyName: 'Olivia Brown',
    motherName: 'Amanda Brown',
    address: '789 Pine Road, Springfield, IL 62703',
    babyDetails: {
      gestationalAge: '37',
      weightKg: 3.2,
      sex: 'female',
      heartRateBpm: 145,
      temperatureC: 36.3
    },
    maternalDetails: {
      maternalAgeYears: 25,
      parity: 'p1',
      location: 'City Medical Center',
      maternalEducation: 'Associate Degree',
      deliveryMode: 'normal',
      gestationalHistory: 'First pregnancy, premature by 3 weeks',
      gestationalAgeEstimationMethod: 'Ballard score'
    }
  }
];

// Create sample patients
samplePatients.forEach((sample, index) => {
  const patientId = uuidv4();
  const folderName = generateFolderName(sample.babyName);
  const folderPath = createPatientFolder(folderName);

  const patientData = {
    id: patientId,
    ...sample,
    images: {},
    folderName,
    folderPath,
    createdAt: new Date(Date.now() - (index * 86400000)).toISOString(), // Stagger dates
    updatedAt: new Date(Date.now() - (index * 86400000)).toISOString()
  };

  savePatientJSON(folderPath, folderName, patientData);

  console.log(`✅ Created patient: ${sample.babyName}`);
  console.log(`   Folder: ${folderName}`);
  console.log(`   Path: ${folderPath}\n`);
});

console.log('✅ Sample patient data created successfully!');
console.log('\nNow you can:');
console.log('1. Start the backend: npm start');
console.log('2. Start the frontend: npm run dev (in root directory)');
console.log('3. Open http://localhost:8080');
console.log('4. You should see 3 sample patients in the list!\n');
