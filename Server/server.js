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
const customersRoutes = require('./routes/customers');
const orderRoutes = require('./routes/orders');
const accountingRoutes = require('./routes/accounting');
const healthRoutes = require('./routes/health');
const validateEnv = require('./config/env-validator');
const { getCacheMiddleware } = require('./config/cache-config');
const { handleError, AppError, ErrorCodes } = require('./utils/error-handler');
const session = require('express-session');
const passport = require('passport');
require('./config/passport'); // Import passport config
const { authenticate } = require('./middleware/auth');

// Validate environment variables before proceeding
validateEnv();

const app = express();
const PORT = process.env.PORT || 5001;

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// More restrictive API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many API requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Body parsing middleware - Place this before routes
app.use(express.json({ limit: '10kb' })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Adjust based on your needs
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.CLIENT_URL || 'http://localhost:3000'],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "same-site" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: "deny" },
  hidePoweredBy: true,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true,
}));

// Apply rate limiting
app.use(globalLimiter); // Global rate limiting
app.use('/api/', apiLimiter); // Stricter API rate limiting

// CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5001',
      process.env.CLIENT_URL
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600 // 10 minutes
}));

// Session middleware - before passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport and restore authentication state from session
app.use(passport.initialize());
app.use(passport.session());

// Compression middleware with optimized settings
app.use(compression({
  level: 6, // Balanced setting between speed and compression
  threshold: '10kb', // Only compress responses above 10kb
  filter: (req, res) => {
    // Don't compress responses with this header
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression filter function
    return compression.filter(req, res);
  },
  // Compress all common text-based responses
  // and some additional mime types
  contentType: [
    'text/html',
    'text/css',
    'text/javascript',
    'application/javascript',
    'application/json',
    'application/x-javascript',
    'text/xml',
    'application/xml',
    'application/xml+rss',
    'text/plain',
    'image/svg+xml'
  ]
}));

// Initialize cache with custom options
const cache = apicache.options({
  statusCodes: {
    include: [200]
  },
  headers: {
    // Prevent client caching of API responses
    'cache-control': 'no-cache, no-store, must-revalidate',
  },
  appendKey: (req) => {
    // Include auth token in cache key to prevent sharing cached data between users
    return req.headers.authorization ? `-${req.headers.authorization}` : '';
  }
}).middleware;

// Apply route-specific caching
app.use(getCacheMiddleware(apicache));

// Request ID middleware
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || require('crypto').randomBytes(16).toString('hex');
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Request logging with correlation ID
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  console.log({
    timestamp: new Date().toISOString(),
    requestId: req.id,
    method: req.method,
    path: req.path,
    query: req.query,
    headers: {
      'user-agent': req.headers['user-agent'],
      'content-type': req.headers['content-type']
    }
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log({
      timestamp: new Date().toISOString(),
      requestId: req.id,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });

  next();
});

// Mount health check routes first (they should be always available)
app.use('/', healthRoutes);

// Connect to MongoDB with enhanced error handling
const initializeServer = async () => {
  try {
    await connectDB();
    
    // Mount API routes
    app.use('/api/auth', authRoutes);
    app.use('/api/inventory', authenticate, inventoryRoutes);
    app.use('/api/suppliers', authenticate, supplierRoutes);
    app.use('/api/customers', authenticate, customersRoutes);
    app.use('/api/orders', authenticate, orderRoutes);
    app.use('/api/accounting', authenticate, accountingRoutes);
    app.use('/api/health', healthRoutes);

    // Handle 404s
    app.use((req, res, next) => {
      next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, ErrorCodes.RESOURCE_NOT_FOUND));
    });

    // Global error handler
    app.use((err, req, res, next) => {
      handleError(err, req, res);
    });

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error('Unhandled Promise Rejection:', err);
      // Log to error monitoring service if available
      if (process.env.NODE_ENV === 'production') {
        // Implement your error monitoring service here
        // Example: Sentry.captureException(err);
      }
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception:', err);
      // Log to error monitoring service if available
      if (process.env.NODE_ENV === 'production') {
        // Implement your error monitoring service here
        // Example: Sentry.captureException(err);
      }
      // Exit process on uncaught exception in production
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

initializeServer();