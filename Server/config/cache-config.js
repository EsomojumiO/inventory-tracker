const cacheConfig = {
  // Static data that rarely changes
  static: {
    duration: '1 hour',
    match: req => req.method === 'GET'
  },
  
  // Frequently updated data
  dynamic: {
    duration: '5 minutes',
    match: req => req.method === 'GET'
  },
  
  // Real-time data
  realtime: {
    duration: '30 seconds',
    match: req => req.method === 'GET'
  }
};

// Route-specific cache settings
const routeCacheConfig = {
  // Static data routes
  '/api/categories': cacheConfig.static,
  '/api/suppliers': cacheConfig.static,
  '/api/tax-rates': cacheConfig.static,
  
  // Dynamic data routes
  '/api/inventory': cacheConfig.dynamic,
  '/api/products': cacheConfig.dynamic,
  
  // Real-time data routes
  '/api/orders': cacheConfig.realtime,
  '/api/inventory/low-stock': cacheConfig.realtime,
  '/api/dashboard/stats': cacheConfig.realtime
};

// Cache middleware generator
const getCacheMiddleware = (apicache) => {
  return (req, res, next) => {
    const path = req.path;
    let cacheSettings = null;

    // Find the most specific cache configuration for the route
    for (const [route, config] of Object.entries(routeCacheConfig)) {
      if (path.startsWith(route) && config.match(req)) {
        cacheSettings = config;
        break;
      }
    }

    if (cacheSettings) {
      apicache.middleware(cacheSettings.duration)(req, res, next);
    } else {
      // Default to no cache for unspecified routes
      res.setHeader('Cache-Control', 'no-store');
      next();
    }
  };
};

module.exports = {
  getCacheMiddleware,
  cacheConfig,
  routeCacheConfig
};
