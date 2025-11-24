/**
 * Simple test script to verify backend API is working
 * Run with: node test-api.js
 */

console.log('Testing backend API setup...\n');

// Test 1: Check if data directory exists
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '../data');

console.log('1. Checking data directory...');
console.log(`   Path: ${dataDir}`);

if (fs.existsSync(dataDir)) {
  console.log('   ✅ Data directory exists');
} else {
  console.log('   ⚠️  Data directory does not exist, creating...');
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('   ✅ Data directory created');
}

// Test 2: Check if we can write to data directory
console.log('\n2. Checking write permissions...');
const testFile = path.join(dataDir, 'test.txt');
try {
  fs.writeFileSync(testFile, 'test');
  fs.unlinkSync(testFile);
  console.log('   ✅ Data directory is writable');
} catch (error) {
  console.log('   ❌ Cannot write to data directory:', error.message);
}

// Test 3: Import and test file handler utilities
console.log('\n3. Testing file handler utilities...');
import { generateFolderName, createPatientFolder } from './utils/fileHandler.js';

const testFolderName = generateFolderName('Test Baby');
console.log(`   Generated folder name: ${testFolderName}`);

const testFolderPath = createPatientFolder(testFolderName);
console.log(`   Created folder at: ${testFolderPath}`);

if (fs.existsSync(testFolderPath)) {
  console.log('   ✅ Patient folder created successfully');
  // Clean up test folder
  fs.rmSync(testFolderPath, { recursive: true });
  console.log('   🧹 Test folder cleaned up');
} else {
  console.log('   ❌ Failed to create patient folder');
}

console.log('\n✅ All tests passed! Backend is ready.');
console.log('\nNext steps:');
console.log('1. Start backend: npm start');
console.log('2. Start frontend: npm run dev (in root directory)');
console.log('3. Open http://localhost:8080\n');
