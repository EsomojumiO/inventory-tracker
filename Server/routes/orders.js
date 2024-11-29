const express = require('express');
const router = express.Router();
const passport = require('passport');
const { 
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus,
    updateShipping,
    generateDocument,
    generateManualDocument,
    createManualOrder,
    getOrderStats
} = require('../controllers/orderController');

// Authentication middleware
const authenticate = passport.authenticate('jwt', { session: false });

// Order management routes
router.post('/', authenticate, createOrder);
router.get('/', authenticate, getOrders);
router.get('/stats', authenticate, getOrderStats);
router.get('/:id', authenticate, getOrderById);
router.patch('/:id/status', authenticate, updateOrderStatus);
router.patch('/:id/shipping', authenticate, updateShipping);

// Document generation routes
router.get('/:id/document/:type', authenticate, generateDocument);
router.post('/document/manual', authenticate, generateManualDocument);

// Manual order creation
router.post('/manual', authenticate, createManualOrder);

module.exports = router;