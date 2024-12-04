const requiredEnvVars = {
  NODE_ENV: ['development', 'production', 'test'],
  PORT: value => !isNaN(value) && value > 0,
  MONGODB_URI: value => value && value.includes('mongodb'),
  JWT_SECRET: value => value && value.length >= 32,
  CLIENT_URL: value => value && (value.startsWith('http://') || value.startsWith('https://')),
};

function validateEnv() {
  const errors = [];

  for (const [key, validator] of Object.entries(requiredEnvVars)) {
    const value = process.env[key];
    
    if (!value) {
      errors.push(`Missing required environment variable: ${key}`);
      continue;
    }

    if (Array.isArray(validator)) {
      if (!validator.includes(value)) {
        errors.push(`Invalid value for ${key}. Must be one of: ${validator.join(', ')}`);
      }
    } else if (typeof validator === 'function') {
      if (!validator(value)) {
        errors.push(`Invalid value for ${key}`);
      }
    }
  }

  if (errors.length > 0) {
    console.error('Environment validation failed:');
    errors.forEach(err => console.error('- ' + err));
    process.exit(1);
  }
}

module.exports = validateEnv;
