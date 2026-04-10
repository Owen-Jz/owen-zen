#!/usr/bin/env node
/**
 * Database Backup Script for Owen Zen
 *
 * Usage:
 *   npm run backup                    # Local backup to ./backups
 *   npm run backup:s3               # Backup to S3
 *   npm run backup:verify           # Verify backup integrity
 *
 * Environment Variables Required:
 *   MONGODB_URI           - MongoDB connection string
 *   MONGODB_DB_NAME       - Database name (default: test)
 *
 * Environment Variables for S3:
 *   AWS_S3_BUCKET         - S3 bucket name
 *   AWS_ACCESS_KEY_ID     - AWS access key
 *   AWS_SECRET_ACCESS_KEY  - AWS secret key
 *   AWS_REGION            - AWS region (default: us-east-1)
 */

const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const CONFIG = {
  backupDir: path.join(__dirname, '../backups'),
  maxBackups: 7, // Keep 7 days of backups locally
  mongodbUri: process.env.MONGODB_URI,
  dbName: process.env.MONGODB_DB_NAME || 'test',
  s3Bucket: process.env.AWS_S3_BUCKET,
  awsAccessKey: process.env.AWS_ACCESS_KEY_ID,
  awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY,
  awsRegion: process.env.AWS_REGION || 'us-east-1',
};

function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`);
}

function error(message) {
  log(message, 'ERROR');
}

function success(message) {
  log(message, 'SUCCESS');
}

function ensureBackupDir() {
  if (!fs.existsSync(CONFIG.backupDir)) {
    fs.mkdirSync(CONFIG.backupDir, { recursive: true });
    log(`Created backup directory: ${CONFIG.backupDir}`);
  }
}

function generateBackupFilename() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `owen-zen-backup-${timestamp}`;
}

function calculateChecksum(filePath) {
  const hash = crypto.createHash('sha256');
  const data = fs.readFileSync(filePath);
  hash.update(data);
  return hash.digest('hex');
}

async function createMongoDump(backupPath) {
  log(`Starting mongodump for database: ${CONFIG.dbName}`);

  const uri = CONFIG.mongodbUri;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  // Build mongodump command
  const outputPath = path.join(backupPath, 'dump');
  const cmd = `mongodump --uri="${uri}" --db=${CONFIG.dbName} --out=${outputPath}`;

  try {
    execSync(cmd, { stdio: 'inherit' });
    success('MongoDB dump completed');
    return outputPath;
  } catch (err) {
    throw new Error(`mongodump failed: ${err.message}`);
  }
}

function archiveBackup(dumpPath, archivePath) {
  log('Creating archive...');

  // Get all files in dump directory
  const files = [];
  function getFiles(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        getFiles(fullPath);
      } else {
        files.push(fullPath);
      }
    }
  }
  getFiles(dumpPath);

  // Create archive using tar (or zip on Windows)
  const parentDir = path.dirname(dumpPath);
  const dumpDirName = path.basename(dumpPath);

  try {
    // Try tar first (Unix systems)
    execSync(`cd ${parentDir} && tar -czf "${archivePath}" "${dumpDirName}"`, { stdio: 'inherit' });
  } catch {
    // Fallback to PowerShell Compress-Archive on Windows
    try {
      execSync(`powershell -Command "Compress-Archive -Path '${dumpPath}\\*' -DestinationPath '${archivePath}'"`, { stdio: 'inherit' });
    } catch (winErr) {
      throw new Error(`Failed to create archive: ${winErr.message}`);
    }
  }

  success(`Archive created: ${archivePath}`);
  return archivePath;
}

async function uploadToS3(archivePath) {
  if (!CONFIG.s3Bucket || !CONFIG.awsAccessKey || !CONFIG.awsSecretKey) {
    throw new Error('S3 configuration incomplete. Set AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY');
  }

  log(`Uploading to S3 bucket: ${CONFIG.s3Bucket}`);

  const filename = path.basename(archivePath);
  const s3Key = `backups/${filename}`;

  // Use AWS CLI if available, otherwise use Node.js SDK
  const command = `aws s3 cp "${archivePath}" "s3://${CONFIG.s3Bucket}/${s3Key}" --region ${CONFIG.awsRegion}`;

  try {
    execSync(command, { stdio: 'inherit' });
    success(`Uploaded to s3://${CONFIG.s3Bucket}/${s3Key}`);

    // Verify upload
    const verifyCmd = `aws s3 ls "s3://${CONFIG.s3Bucket}/${s3Key}" --region ${CONFIG.awsRegion}`;
    execSync(verifyCmd, { stdio: 'inherit' });
    success('S3 upload verified');

    return s3Key;
  } catch (err) {
    throw new Error(`S3 upload failed: ${err.message}. Make sure AWS CLI is configured or credentials are valid.`);
  }
}

function cleanupOldBackups() {
  if (fs.existsSync(CONFIG.backupDir)) {
    const files = fs.readdirSync(CONFIG.backupDir)
      .filter(f => f.endsWith('.tar.gz') || f.endsWith('.zip'))
      .map(f => ({
        name: f,
        path: path.join(CONFIG.backupDir, f),
        time: fs.statSync(path.join(CONFIG.backupDir, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    // Keep only the most recent backups
    if (files.length > CONFIG.maxBackups) {
      const toDelete = files.slice(CONFIG.maxBackups);
      for (const file of toDelete) {
        log(`Removing old backup: ${file.name}`);
        fs.unlinkSync(file.path);
      }
      success(`Cleaned up ${toDelete.length} old backup(s)`);
    }
  }
}

async function verifyBackup(archivePath) {
  log(`Verifying backup: ${archivePath}`);

  if (!fs.existsSync(archivePath)) {
    throw new Error(`Backup file not found: ${archivePath}`);
  }

  // Calculate checksum
  const checksum = calculateChecksum(archivePath);
  log(`Checksum (SHA256): ${checksum}`);

  // Verify archive integrity
  const ext = path.extname(archivePath);
  try {
    if (ext === '.gz' || ext === '.tar.gz') {
      execSync(`tar -tzf "${archivePath}" > /dev/null`, { stdio: 'pipe' });
    } else if (ext === '.zip') {
      execSync(`powershell -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::OpenRead('${archivePath}').Dispose()"`, { stdio: 'pipe' });
    }
    success('Archive integrity verified');
  } catch {
    throw new Error('Archive integrity check failed');
  }

  return checksum;
}

async function performBackup(options = {}) {
  const { uploadToS3: shouldUpload = false } = options;

  ensureBackupDir();

  const backupFilename = generateBackupFilename();
  const backupDir = path.join(CONFIG.backupDir, backupFilename);
  fs.mkdirSync(backupDir, { recursive: true });

  let archivePath;
  try {
    // Create mongodump
    const dumpPath = await createMongoDump(backupDir);

    // Create archive
    archivePath = path.join(CONFIG.backupDir, `${backupFilename}.tar.gz`);
    archiveBackup(dumpPath, archivePath);

    // Clean up dump directory
    fs.rmSync(dumpPath, { recursive: true, force: true });

    // Calculate checksum
    const checksum = await verifyBackup(archivePath);

    // Save checksum
    const checksumPath = `${archivePath}.sha256`;
    fs.writeFileSync(checksumPath, checksum);
    log(`Checksum saved: ${checksumPath}`);

    // Upload to S3 if requested
    let s3Key;
    if (shouldUpload) {
      s3Key = await uploadToS3(archivePath);
    }

    // Cleanup old backups
    cleanupOldBackups();

    // Return backup info
    const backupInfo = {
      filename: path.basename(archivePath),
      path: archivePath,
      checksum,
      s3Key: s3Key || null,
      timestamp: new Date().toISOString(),
      size: fs.statSync(archivePath).size,
    };

    success('Backup completed successfully!');
    console.log('\nBackup Information:');
    console.log(JSON.stringify(backupInfo, null, 2));

    return backupInfo;
  } catch (err) {
    error(`Backup failed: ${err.message}`);
    // Clean up partial backup
    if (fs.existsSync(backupDir)) {
      fs.rmSync(backupDir, { recursive: true, force: true });
    }
    if (archivePath && fs.existsSync(archivePath)) {
      fs.unlinkSync(archivePath);
    }
    throw err;
  }
}

// Main CLI
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'local';

  log('Starting backup process...');
  log(`Command: ${command}`);

  try {
    switch (command) {
      case 'local':
        await performBackup({ uploadToS3: false });
        break;

      case 's3':
        await performBackup({ uploadToS3: true });
        break;

      case 'verify':
        if (args[1]) {
          await verifyBackup(args[1]);
          success('Backup verified successfully');
        } else {
          // Find most recent backup
          const files = fs.readdirSync(CONFIG.backupDir)
            .filter(f => f.endsWith('.tar.gz'))
            .map(f => path.join(CONFIG.backupDir, f))
            .sort((a, b) => fs.statSync(b).mtime - fs.statSync(a).mtime);

          if (files.length > 0) {
            await verifyBackup(files[0]);
            success('Most recent backup verified successfully');
          } else {
            error('No backup files found');
            process.exit(1);
          }
        }
        break;

      case 'list':
        if (!fs.existsSync(CONFIG.backupDir)) {
          console.log('No backups found');
          break;
        }
        const files = fs.readdirSync(CONFIG.backupDir)
          .filter(f => f.endsWith('.tar.gz') || f.endsWith('.zip'))
          .map(f => {
            const fpath = path.join(CONFIG.backupDir, f);
            const stat = fs.statSync(fpath);
            return {
              name: f,
              size: stat.size,
              date: stat.mtime.toISOString(),
            };
          })
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        console.log('\nAvailable Backups:');
        console.log(JSON.stringify(files, null, 2));
        break;

      default:
        console.log('Usage:');
        console.log('  npm run backup         # Local backup');
        console.log('  npm run backup:s3      # Backup to S3');
        console.log('  npm run backup:verify  # Verify most recent backup');
        console.log('  npm run backup:list    # List all backups');
        break;
    }
  } catch (err) {
    error(err.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { performBackup, verifyBackup, uploadToS3 };
