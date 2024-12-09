const validateEnv = () => {
    const requiredEnvVars = [
        'NODE_ENV',
        'PORT',
        'MONGODB_URI',
        'JWT_SECRET',
        'CLIENT_URL'
    ];

    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

    if (missingEnvVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    }

    // Validate PORT is a number
    if (isNaN(process.env.PORT)) {
        throw new Error('PORT must be a number');
    }

    // Validate NODE_ENV
    const validEnvs = ['development', 'production', 'test'];
    if (!validEnvs.includes(process.env.NODE_ENV)) {
        throw new Error('NODE_ENV must be one of: development, production, test');
    }

    // Validate MONGODB_URI format
    const mongoUrlPattern = /^mongodb(\+srv)?:\/\/.+/;
    if (!mongoUrlPattern.test(process.env.MONGODB_URI)) {
        throw new Error('Invalid MONGODB_URI format');
    }

    // Validate JWT_SECRET length
    if (process.env.JWT_SECRET.length < 16) {
        throw new Error('JWT_SECRET must be at least 16 characters long');
    }

    // Validate CLIENT_URL format
    try {
        new URL(process.env.CLIENT_URL);
    } catch (error) {
        throw new Error('Invalid CLIENT_URL format');
    }
};

module.exports = validateEnv;
