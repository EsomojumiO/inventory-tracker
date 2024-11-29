const express = require('express');
const router = express.Router();
const AnalyticsService = require('../services/analyticsService');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Middleware to validate date parameters
const validateDateParams = (req, res, next) => {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
        return res.status(400).json({ 
            error: 'Both startDate and endDate are required' 
        });
    }

    if (isNaN(Date.parse(startDate)) || isNaN(Date.parse(endDate))) {
        return res.status(400).json({ 
            error: 'Invalid date format' 
        });
    }

    if (new Date(startDate) > new Date(endDate)) {
        return res.status(400).json({ 
            error: 'startDate cannot be later than endDate' 
        });
    }

    next();
};

// Get dashboard summary
router.get('/dashboard', 
    authenticateToken,
    async (req, res) => {
        try {
            const summary = await AnalyticsService.getDashboardSummary();
            res.json(summary);
        } catch (error) {
            res.status(500).json({ 
                error: 'Error fetching dashboard summary' 
            });
        }
    }
);

// Get sales analytics
router.get('/sales',
    authenticateToken,
    authorizeRole(['admin', 'manager']),
    validateDateParams,
    async (req, res) => {
        try {
            const { startDate, endDate, groupBy } = req.query;
            const analytics = await AnalyticsService.getSalesAnalytics(
                startDate,
                endDate,
                groupBy
            );
            res.json(analytics);
        } catch (error) {
            res.status(500).json({ 
                error: 'Error fetching sales analytics' 
            });
        }
    }
);

// Get product performance analytics
router.get('/products',
    authenticateToken,
    authorizeRole(['admin', 'manager']),
    validateDateParams,
    async (req, res) => {
        try {
            const { startDate, endDate } = req.query;
            const analytics = await AnalyticsService.getProductAnalytics(
                startDate,
                endDate
            );
            res.json(analytics);
        } catch (error) {
            res.status(500).json({ 
                error: 'Error fetching product analytics' 
            });
        }
    }
);

// Get inventory analytics
router.get('/inventory',
    authenticateToken,
    authorizeRole(['admin', 'manager']),
    async (req, res) => {
        try {
            const analytics = await AnalyticsService.getInventoryAnalytics();
            res.json(analytics);
        } catch (error) {
            res.status(500).json({ 
                error: 'Error fetching inventory analytics' 
            });
        }
    }
);

// Get customer analytics
router.get('/customers',
    authenticateToken,
    authorizeRole(['admin', 'manager']),
    validateDateParams,
    async (req, res) => {
        try {
            const { startDate, endDate } = req.query;
            const analytics = await AnalyticsService.getCustomerAnalytics(
                startDate,
                endDate
            );
            res.json(analytics);
        } catch (error) {
            res.status(500).json({ 
                error: 'Error fetching customer analytics' 
            });
        }
    }
);

// Get stock movement analytics
router.get('/stock-movements',
    authenticateToken,
    authorizeRole(['admin', 'manager']),
    validateDateParams,
    async (req, res) => {
        try {
            const { startDate, endDate } = req.query;
            const analytics = await AnalyticsService.getStockMovementAnalytics(
                startDate,
                endDate
            );
            res.json(analytics);
        } catch (error) {
            res.status(500).json({ 
                error: 'Error fetching stock movement analytics' 
            });
        }
    }
);

// Get payment analytics
router.get('/payments',
    authenticateToken,
    authorizeRole(['admin', 'manager']),
    validateDateParams,
    async (req, res) => {
        try {
            const { startDate, endDate } = req.query;
            const analytics = await AnalyticsService.getPaymentAnalytics(
                startDate,
                endDate
            );
            res.json(analytics);
        } catch (error) {
            res.status(500).json({ 
                error: 'Error fetching payment analytics' 
            });
        }
    }
);

module.exports = router;
