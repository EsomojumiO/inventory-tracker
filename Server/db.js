const mongoose = require('mongoose');

// Import all models
require('./models');

const MAX_RETRIES = 3;
const RETRY_INTERVAL = 5000; // 5 seconds

// Index management configuration
const indexConfig = {
  development: {
    autoIndex: true,
    // Additional index options for development
    createIndexes: true,
    validateIndexes: true
  },
  production: {
    autoIndex: false,
    // Disable automatic index creation in production
    createIndexes: false,
    validateIndexes: true
  },
  test: {
    autoIndex: true,
    // Test environment index options
    createIndexes: true,
    validateIndexes: false
  }
};

const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return indexConfig[env] || indexConfig.development;
};

const connectWithRetry = async (retryCount = 0) => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    const envConfig = getEnvironmentConfig();
    
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 50,
      minPoolSize: 10,
      maxIdleTimeMS: 10000,
      connectTimeoutMS: 10000,
      bufferCommands: false,
      autoIndex: envConfig.autoIndex
    });

    console.log('MongoDB connected successfully');
    
    // Handle index creation based on environment
    if (envConfig.createIndexes) {
      const models = mongoose.models;
      for (const [modelName, Model] of Object.entries(models)) {
        try {
          if (envConfig.validateIndexes) {
            // Validate existing indexes
            const existingIndexes = await Model.collection.getIndexes();
            console.log(`Current indexes for ${modelName}:`, existingIndexes);
          }
          
          // Create or update indexes
          await Model.createIndexes();
          console.log(`Created/Updated indexes for ${modelName} model`);
          
          // Log the final index configuration
          const finalIndexes = await Model.collection.getIndexes();
          console.log(`Final indexes for ${modelName}:`, finalIndexes);
        } catch (error) {
          console.warn(`Warning: Issue with indexes for ${modelName}:`, error.message);
          
          // In development, provide more detailed error information
          if (process.env.NODE_ENV === 'development') {
            console.error('Detailed error:', error);
          }
        }
      }
    } else {
      console.log('Skipping index creation as per environment configuration');
    }

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      if (!mongoose.connection.readyState) {
        setTimeout(() => connectWithRetry(0), RETRY_INTERVAL);
      }
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected. Attempting to reconnect...');
      setTimeout(() => connectWithRetry(0), RETRY_INTERVAL);
    });

    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('Error during MongoDB disconnect:', err);
        process.exit(1);
      }
    });

  } catch (err) {
    console.error('Error connecting to MongoDB:', err.message);
    
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying connection... Attempt ${retryCount + 1} of ${MAX_RETRIES}`);
      setTimeout(() => connectWithRetry(retryCount + 1), RETRY_INTERVAL);
    } else {
      console.error('Max retry attempts reached. Exiting...');
      process.exit(1);
    }
  }
};

module.exports = connectWithRetry;
