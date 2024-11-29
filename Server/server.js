require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const apicache = require('apicache');
const connectDB = require('./db');
const authRoutes = require('./routes/auth');
const inventoryRoutes = require('./routes/inventory');
const supplierRoutes = require('./routes/suppliers');
const customerRoutes = require('./routes/customers');
const orderRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 5001;

// Initialize cache
const cache = apicache.middleware;
const onlyStatus200 = (req, res) => res.statusCode === 200;
const cacheSuccesses = cache('5 minutes', onlyStatus200);

// Connect to MongoDB
connectDB().then(() => {
  // Compression middleware
  app.use(compression());

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));

  app.use(cookieParser());
  app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  });
  app.use('/api/', limiter);

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  // Set content type for API routes
  app.use('/api', (req, res, next) => {
    res.type('application/json');
    next();
  });

  // Mount API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/inventory', inventoryRoutes);
  app.use('/api/suppliers', cacheSuccesses, supplierRoutes);
  app.use('/api/customers', cacheSuccesses, customerRoutes);
  app.use('/api/orders', cacheSuccesses, orderRoutes);

  // Handle 404s - After all routes
  app.use((req, res) => {
    console.log(`[404] ${req.method} ${req.path}`);
    res.status(404).json({
      success: false,
      message: `Route not found: ${req.method} ${req.path}`
    });
  });

  // Error handling middleware
  app.use((err, req, res, next) => {
    console.error('Server error:', err);

    // Always set JSON content type
    res.setHeader('Content-Type', 'application/json');
    
    // Handle different types of errors
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON payload',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
      });
    }

    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(err.errors).map(e => e.message)
      });
    }

    // Generic error response
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'An unexpected error occurred',
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  });

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});