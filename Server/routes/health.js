const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const os = require('os');

// System metrics collection
const getSystemMetrics = () => ({
  memory: {
    total: os.totalmem(),
    free: os.freemem(),
    used: os.totalmem() - os.freemem(),
    usagePercent: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)
  },
  cpu: {
    loadAvg: os.loadavg(),
    cpus: os.cpus().length
  },
  uptime: process.uptime()
});

// Database metrics collection
const getDatabaseMetrics = async () => {
  const adminDb = mongoose.connection.db.admin();
  const serverStatus = await adminDb.serverStatus();
  
  return {
    connections: serverStatus.connections,
    opcounters: serverStatus.opcounters,
    mem: serverStatus.mem,
    wiredTiger: {
      cache: serverStatus.wiredTiger.cache,
      concurrentTransactions: serverStatus.wiredTiger.concurrentTransactions
    }
  };
};

// Basic health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    service: 'inventory-tracker-api',
    version: process.env.npm_package_version
  });
});

// Detailed health check with system metrics
router.get('/health/detailed', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1;
    const systemMetrics = getSystemMetrics();
    
    const response = {
      status: dbStatus ? 'ok' : 'degraded',
      timestamp: new Date(),
      service: {
        name: 'inventory-tracker-api',
        version: process.env.npm_package_version,
        nodeVersion: process.version,
        uptime: systemMetrics.uptime
      },
      system: {
        memory: systemMetrics.memory,
        cpu: systemMetrics.cpu
      },
      database: {
        status: dbStatus ? 'connected' : 'disconnected',
        name: mongoose.connection.name,
        host: mongoose.connection.host
      }
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error fetching health metrics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Detailed database metrics (protected endpoint)
router.get('/health/database', async (req, res) => {
  try {
    // Basic auth check (you should implement proper authentication)
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_API_KEY}`) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized'
      });
    }

    const dbMetrics = await getDatabaseMetrics();
    const response = {
      status: 'ok',
      timestamp: new Date(),
      metrics: dbMetrics
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error fetching database metrics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
