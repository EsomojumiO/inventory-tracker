class AppError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Standard error codes
const ErrorCodes = {
  // Authentication & Authorization
  INVALID_CREDENTIALS: 'AUTH001',
  TOKEN_EXPIRED: 'AUTH002',
  UNAUTHORIZED: 'AUTH003',
  FORBIDDEN: 'AUTH004',
  
  // Database
  DB_CONNECTION_ERROR: 'DB001',
  DB_QUERY_ERROR: 'DB002',
  DB_VALIDATION_ERROR: 'DB003',
  DB_DUPLICATE_KEY: 'DB004',
  
  // Resource
  RESOURCE_NOT_FOUND: 'RES001',
  RESOURCE_ALREADY_EXISTS: 'RES002',
  RESOURCE_VALIDATION_ERROR: 'RES003',
  
  // Input
  INVALID_INPUT: 'INP001',
  MISSING_REQUIRED_FIELD: 'INP002',
  INVALID_FORMAT: 'INP003',
  
  // Business Logic
  INSUFFICIENT_INVENTORY: 'BUS001',
  ORDER_ALREADY_PROCESSED: 'BUS002',
  PAYMENT_FAILED: 'BUS003',
  
  // System
  INTERNAL_SERVER_ERROR: 'SYS001',
  SERVICE_UNAVAILABLE: 'SYS002',
  EXTERNAL_API_ERROR: 'SYS003'
};

const handleError = (err, req, res) => {
  if (err instanceof AppError) {
    // Handle operational errors
    return res.status(err.statusCode).json({
      status: err.status,
      errorCode: err.errorCode,
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  // Handle MongoDB specific errors
  if (err.name === 'MongoServerError') {
    if (err.code === 11000) {
      return res.status(409).json({
        status: 'fail',
        errorCode: ErrorCodes.DB_DUPLICATE_KEY,
        message: 'Duplicate key error',
        details: err.keyValue
      });
    }
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      status: 'fail',
      errorCode: ErrorCodes.DB_VALIDATION_ERROR,
      message: 'Validation error',
      details: Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      status: 'fail',
      errorCode: ErrorCodes.INVALID_FORMAT,
      message: `Invalid ${err.path}: ${err.value}`
    });
  }

  // Log unexpected errors
  console.error('Unexpected error:', {
    error: err,
    timestamp: new Date().toISOString(),
    requestId: req.id,
    path: req.path,
    method: req.method,
    query: req.query,
    body: req.body,
    user: req.user ? req.user.id : 'anonymous'
  });

  // Send generic error in production, detailed in development
  const response = {
    status: 'error',
    errorCode: ErrorCodes.INTERNAL_SERVER_ERROR,
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong'
      : err.message
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.details = err;
  }

  return res.status(500).json(response);
};

module.exports = {
  AppError,
  ErrorCodes,
  handleError
};
