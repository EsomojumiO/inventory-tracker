const AWS = require('aws-sdk');
const { Storage } = require('@google-cloud/storage');
const Azure = require('@azure/storage-blob');

class CloudProvider {
    constructor(config) {
        this.provider = config.provider;
        this.config = config;
        this.client = null;
        this.initialize();
    }

    initialize() {
        switch (this.provider) {
            case 'aws':
                AWS.config.update({
                    accessKeyId: this.config.credentials.accessKeyId,
                    secretAccessKey: this.config.credentials.secretAccessKey,
                    region: this.config.region
                });
                this.client = new AWS.S3();
                break;

            case 'gcp':
                this.client = new Storage({
                    projectId: this.config.projectId,
                    keyFilename: this.config.keyFilePath
                });
                break;

            case 'azure':
                const blobServiceClient = Azure.BlobServiceClient.fromConnectionString(
                    this.config.connectionString
                );
                this.client = blobServiceClient;
                break;

            default:
                throw new Error('Unsupported cloud provider');
        }
    }

    async uploadFile(bucket, key, data, metadata = {}) {
        try {
            switch (this.provider) {
                case 'aws':
                    await this.client.putObject({
                        Bucket: bucket,
                        Key: key,
                        Body: data,
                        Metadata: metadata
                    }).promise();
                    break;

                case 'gcp':
                    const gcpBucket = this.client.bucket(bucket);
                    const file = gcpBucket.file(key);
                    await file.save(data, {
                        metadata: metadata
                    });
                    break;

                case 'azure':
                    const containerClient = this.client.getContainerClient(bucket);
                    const blockBlobClient = containerClient.getBlockBlobClient(key);
                    await blockBlobClient.upload(data, data.length, {
                        metadata: metadata
                    });
                    break;
            }
            return true;
        } catch (error) {
            console.error('Error uploading file:', error);
            throw error;
        }
    }

    async downloadFile(bucket, key) {
        try {
            switch (this.provider) {
                case 'aws':
                    const response = await this.client.getObject({
                        Bucket: bucket,
                        Key: key
                    }).promise();
                    return response.Body;

                case 'gcp':
                    const gcpBucket = this.client.bucket(bucket);
                    const file = gcpBucket.file(key);
                    const [data] = await file.download();
                    return data;

                case 'azure':
                    const containerClient = this.client.getContainerClient(bucket);
                    const blockBlobClient = containerClient.getBlockBlobClient(key);
                    const downloadResponse = await blockBlobClient.download();
                    return await streamToBuffer(downloadResponse.readableStreamBody);
            }
        } catch (error) {
            console.error('Error downloading file:', error);
            throw error;
        }
    }

    async deleteFile(bucket, key) {
        try {
            switch (this.provider) {
                case 'aws':
                    await this.client.deleteObject({
                        Bucket: bucket,
                        Key: key
                    }).promise();
                    break;

                case 'gcp':
                    const gcpBucket = this.client.bucket(bucket);
                    const file = gcpBucket.file(key);
                    await file.delete();
                    break;

                case 'azure':
                    const containerClient = this.client.getContainerClient(bucket);
                    const blockBlobClient = containerClient.getBlockBlobClient(key);
                    await blockBlobClient.delete();
                    break;
            }
            return true;
        } catch (error) {
            console.error('Error deleting file:', error);
            throw error;
        }
    }

    async listFiles(bucket, prefix = '') {
        try {
            switch (this.provider) {
                case 'aws':
                    const awsResponse = await this.client.listObjectsV2({
                        Bucket: bucket,
                        Prefix: prefix
                    }).promise();
                    return awsResponse.Contents.map(item => ({
                        name: item.Key,
                        size: item.Size,
                        lastModified: item.LastModified
                    }));

                case 'gcp':
                    const gcpBucket = this.client.bucket(bucket);
                    const [files] = await gcpBucket.getFiles({ prefix });
                    return files.map(file => ({
                        name: file.name,
                        size: file.metadata.size,
                        lastModified: file.metadata.updated
                    }));

                case 'azure':
                    const containerClient = this.client.getContainerClient(bucket);
                    const blobs = containerClient.listBlobsFlat({ prefix });
                    const results = [];
                    for await (const blob of blobs) {
                        results.push({
                            name: blob.name,
                            size: blob.properties.contentLength,
                            lastModified: blob.properties.lastModified
                        });
                    }
                    return results;
            }
        } catch (error) {
            console.error('Error listing files:', error);
            throw error;
        }
    }
}

// Helper function to convert stream to buffer (for Azure)
async function streamToBuffer(readableStream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on('data', (data) => {
            chunks.push(data instanceof Buffer ? data : Buffer.from(data));
        });
        readableStream.on('end', () => {
            resolve(Buffer.concat(chunks));
        });
        readableStream.on('error', reject);
    });
}

module.exports = CloudProvider;
