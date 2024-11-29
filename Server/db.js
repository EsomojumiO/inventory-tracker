const mongoose = require('mongoose');

// Import all models
require('./models');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/inventory';
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 50,
      minPoolSize: 10,
      maxIdleTimeMS: 10000,
      connectTimeoutMS: 10000,
      bufferCommands: false,
      autoIndex: false,
    });

    console.log('MongoDB connected successfully');
    
    // Create indexes in development
    if (process.env.NODE_ENV === 'development') {
      const models = mongoose.models;
      for (const [modelName, Model] of Object.entries(models)) {
        try {
          // Drop existing indexes first
          await Model.collection.dropIndexes();
          // Create new indexes
          await Model.createIndexes();
          console.log(`Created indexes for ${modelName} model`);
        } catch (error) {
          // Log the error but don't fail the connection
          console.warn(`Warning: Could not create indexes for ${modelName}:`, error.message);
        }
      }
    }

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

  } catch (err) {
    console.error('Error connecting to MongoDB:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
