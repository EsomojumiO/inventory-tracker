const AWS = require('aws-sdk');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;
const cron = require('node-cron');
const { createGzip } = require('zlib');
const { pipeline } = require('stream/promises');
const { createReadStream, createWriteStream } = require('fs');

class BackupService {
  constructor() {
    // Configure AWS S3
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-west-2'
    });
    
    this.bucketName = process.env.AWS_BACKUP_BUCKET;
    this.backupPath = path.join(__dirname, '../backups');
  }

  async init() {
    // Create backup directory if it doesn't exist
    try {
      await fs.mkdir(this.backupPath, { recursive: true });
    } catch (error) {
      console.error('Error creating backup directory:', error);
    }

    // Schedule daily backup at 2 AM
    cron.schedule('0 2 * * *', async () => {
      try {
        await this.createBackup();
        console.log('Daily backup completed successfully');
      } catch (error) {
        console.error('Daily backup failed:', error);
      }
    });
  }

  async createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-${timestamp}.gz`;
    const backupFilePath = path.join(this.backupPath, backupFileName);

    try {
      // Get all collections
      const collections = await mongoose.connection.db.collections();
      const backupData = {};

      // Export data from each collection
      for (const collection of collections) {
        const documents = await collection.find({}).toArray();
        backupData[collection.collectionName] = documents;
      }

      // Create a gzipped backup file
      const writeStream = createWriteStream(backupFilePath);
      const gzip = createGzip();

      await pipeline(
        Buffer.from(JSON.stringify(backupData)),
        gzip,
        writeStream
      );

      // Upload to S3
      const fileStream = createReadStream(backupFilePath);
      await this.s3.upload({
        Bucket: this.bucketName,
        Key: backupFileName,
        Body: fileStream,
        ContentType: 'application/gzip'
      }).promise();

      // Clean up local file
      await fs.unlink(backupFilePath);

      // Keep only last 30 days of backups in S3
      await this.cleanupOldBackups();

      return {
        success: true,
        filename: backupFileName
      };
    } catch (error) {
      console.error('Backup creation failed:', error);
      throw error;
    }
  }

  async restoreFromBackup(backupFileName) {
    try {
      // Download from S3
      const s3Object = await this.s3.getObject({
        Bucket: this.bucketName,
        Key: backupFileName
      }).promise();

      // Decompress and parse the backup data
      const backupData = JSON.parse(s3Object.Body.toString());

      // Clear existing data
      const collections = await mongoose.connection.db.collections();
      for (const collection of collections) {
        await collection.deleteMany({});
      }

      // Restore data to each collection
      for (const [collectionName, documents] of Object.entries(backupData)) {
        if (documents.length > 0) {
          const collection = mongoose.connection.db.collection(collectionName);
          await collection.insertMany(documents);
        }
      }

      return {
        success: true,
        message: 'Backup restored successfully'
      };
    } catch (error) {
      console.error('Restore failed:', error);
      throw error;
    }
  }

  async listBackups() {
    try {
      const response = await this.s3.listObjects({
        Bucket: this.bucketName,
        Prefix: 'backup-'
      }).promise();

      return response.Contents.map(item => ({
        filename: item.Key,
        size: item.Size,
        lastModified: item.LastModified
      }));
    } catch (error) {
      console.error('Error listing backups:', error);
      throw error;
    }
  }

  async cleanupOldBackups() {
    try {
      const backups = await this.listBackups();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const oldBackups = backups.filter(backup => 
        backup.lastModified < thirtyDaysAgo
      );

      for (const backup of oldBackups) {
        await this.s3.deleteObject({
          Bucket: this.bucketName,
          Key: backup.filename
        }).promise();
      }
    } catch (error) {
      console.error('Error cleaning up old backups:', error);
    }
  }
}

module.exports = new BackupService();
