require('dotenv').config();

const config = {
    // Server settings
    PORT: process.env.PORT || 5001,
    NODE_ENV: process.env.NODE_ENV || 'development',
    
    // MongoDB settings
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/retail-master',
    
    // JWT settings
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-here',
    JWT_EXPIRY: process.env.JWT_EXPIRY || '24h',
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret-key-here',
    REFRESH_TOKEN_EXPIRY: process.env.REFRESH_TOKEN_EXPIRY || '7d',
    
    // Cookie settings
    TOKEN_KEY: 'auth_token',
    REFRESH_TOKEN_KEY: 'refresh_token',
    COOKIE_SECRET: process.env.COOKIE_SECRET || 'your-cookie-secret-here',
    
    // Security settings
    MAX_LOGIN_ATTEMPTS: 5,
    LOCK_TIME: 5 * 60 * 1000, // 5 minutes
    
    // CORS settings
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
    
    // Rate limiting
    RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
    RATE_LIMIT_MAX: 100, // 100 requests per window
    
    // Password requirements
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_REQUIRE_UPPERCASE: true,
    PASSWORD_REQUIRE_LOWERCASE: true,
    PASSWORD_REQUIRE_NUMBER: true,
    PASSWORD_REQUIRE_SYMBOL: false,
    
    // Session settings
    SESSION_SECRET: process.env.SESSION_SECRET || 'your-session-secret-here',
    SESSION_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
    
    // File upload settings
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
    
    // Email settings (if needed)
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@retail-master.com',
};

module.exports = config;
