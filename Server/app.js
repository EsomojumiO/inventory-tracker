const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const session = require('express-session');
const passport = require('./config/passport');
const config = require('./config/config');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo')(session);
const jwt = require('jsonwebtoken');

const authRoutes = require('./routes/auth');
const inventoryRoutes = require('./routes/inventory');
const salesRoutes = require('./routes/sales');
const settingsRoutes = require('./routes/settings');
const analyticsRoutes = require('./routes/analytics');
const suppliersRoutes = require('./routes/suppliers');
const purchaseOrdersRoutes = require('./routes/purchaseOrders');
const backupRoutes = require('./routes/backupRoutes');
const backupService = require('./services/backupService');
const auditRoutes = require('./routes/auditRoutes');
const orderRoutes = require('./routes/orders');
const salesTerminalRoutes = require('./routes/salesTerminal');

const app = express();

// Middleware
app.use(morgan('dev')); // Add logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['set-cookie']
}));

// Cookie parser middleware
app.use(cookieParser());

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax'
    },
    store: new MongoStore({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory-tracker',
        ttl: 24 * 60 * 60 // = 24 hours
    })
}));

// Initialize Passport and restore authentication state from session
app.use(passport.initialize());
app.use(passport.session());

// JWT token verification middleware
app.use((req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret');
        req.user = decoded;
        next();
    } catch (error) {
        // Clear invalid token
        res.clearCookie('token');
        next();
    }
});

// Disable caching for all routes in development
app.use((req, res, next) => {
    res.header('Cache-Control', 'no-store');
    next();
});

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Add response logging middleware
app.use((req, res, next) => {
    const originalJson = res.json;
    res.json = function(data) {
        console.log('Response data:', {
            path: req.path,
            method: req.method,
            statusCode: res.statusCode,
            dataKeys: data ? Object.keys(data) : []
        });
        return originalJson.call(this, data);
    };
    next();
});

// Set response type for API routes
app.use('/api', (req, res, next) => {
    res.type('application/json');
    next();
});

// Debug middleware for routes
app.use((req, res, next) => {
    console.log(`[DEBUG] Route accessed: ${req.method} ${req.originalUrl}`);
    console.log('[DEBUG] Available routes:', app._router.stack
        .filter(r => r.route)
        .map(r => `${Object.keys(r.route.methods)} ${r.route.path}`));
    next();
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/purchase-orders', purchaseOrdersRoutes);
app.use('/api/backups', backupRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/sales-terminal', salesTerminalRoutes);

// Debug middleware for 404s
app.use((req, res, next) => {
    console.log(`[DEBUG] Accessing path: ${req.method} ${req.path}`);
    next();
});

// Error handling middleware for JSON parsing errors
app.use((err, req, res, next) => {
    // Always set JSON content type
    res.setHeader('Content-Type', 'application/json');

    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        console.error('JSON parsing error:', err);
        return res.status(400).json({
            success: false,
            message: 'Invalid JSON payload',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }

    // Handle mongoose validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: Object.values(err.errors).map(e => e.message)
        });
    }

    // Handle mongoose cast errors
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID format',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }

    next(err);
});

// General error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    
    // Always set JSON content type
    res.setHeader('Content-Type', 'application/json');
    
    // Ensure we don't expose internal error details in production
    const error = process.env.NODE_ENV === 'development' 
        ? { stack: err.stack, ...err }
        : undefined;
    
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        error
    });
});

// Handle 404 errors
app.use((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.path}`
    });
});

// MongoDB connection with retry logic
const connectWithRetry = async () => {
    const maxRetries = 5;
    let retries = 0;

    while (retries < maxRetries) {
        try {
            console.log(`MongoDB connection attempt ${retries + 1} of ${maxRetries}...`);
            await mongoose.connect(config.MONGODB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
            });
            console.log('Successfully connected to MongoDB');
            return true;
        } catch (err) {
            console.error(`MongoDB connection attempt ${retries + 1} failed:`, err.message);
            retries++;
            if (retries === maxRetries) {
                console.error('Max retries reached. Could not connect to MongoDB');
                return false;
            }
            // Wait for 2 seconds before retrying
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
};

// Initialize MongoDB connection
connectWithRetry().then(success => {
    if (!success) {
        console.error('Could not establish MongoDB connection. Server will start but may not function correctly.');
    }
}).catch(err => {
    console.error('Error during MongoDB connection:', err);
});

// Monitor MongoDB connection
mongoose.connection.on('connected', () => {
    console.log('MongoDB connection established');
});

mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected. Attempting to reconnect...');
    connectWithRetry();
});

// Initialize backup service
backupService.init().catch(console.error);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Handle server shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed. Disconnecting from MongoDB...');
        mongoose.connection.close(false, () => {
            console.log('MongoDB connection closed. Process terminating...');
            process.exit(0);
        });
    });
});

module.exports = app;
