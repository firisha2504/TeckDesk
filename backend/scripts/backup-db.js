import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '..', 'data', 'backups');
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupFilePath = path.join(backupDir, `techdesk_backup_${timestamp}.json`);

  console.log('Connecting to database for full snapshot...');
  await connectDatabase();

  const collections = await mongoose.connection.db.listCollections().toArray();
  const backupData = {
    metadata: {
      timestamp: new Date().toISOString(),
      database: mongoose.connection.db.databaseName,
      totalCollections: collections.length,
    },
    collections: {},
  };

  let totalDocs = 0;
  for (const col of collections) {
    const docs = await mongoose.connection.collection(col.name).find({}).toArray();
    backupData.collections[col.name] = docs;
    totalDocs += docs.length;
    console.log(` - Captured ${docs.length} documents from ${col.name}`);
  }

  fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf-8');
  const fileStats = fs.statSync(backupFilePath);

  console.log(`\nBackup successfully written to: ${backupFilePath}`);
  console.log(`Total documents archived: ${totalDocs}`);
  console.log(`Backup size: ${(fileStats.size / 1024).toFixed(2)} KB`);

  // Verification step: read back file and verify JSON integrity and counts
  const readBack = JSON.parse(fs.readFileSync(backupFilePath, 'utf-8'));
  let verifiedCount = 0;
  for (const [name, docs] of Object.entries(readBack.collections)) {
    verifiedCount += docs.length;
  }

  if (verifiedCount !== totalDocs) {
    throw new Error(`Verification mismatch: expected ${totalDocs} docs, verified ${verifiedCount}`);
  }

  console.log(`Verification: 100% integrity confirmed (${verifiedCount}/${totalDocs} documents parsed cleanly).`);

  await disconnectDatabase();
  return { backupFilePath, totalDocs, sizeBytes: fileStats.size };
}

createBackup().catch((err) => {
  console.error('Backup failed:', err);
  process.exit(1);
});
