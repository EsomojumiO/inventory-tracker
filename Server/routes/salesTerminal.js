const express = require('express');
const router = express.Router();
const salesTerminalController = require('../controllers/salesTerminalController');
const auth = require('../middleware/auth');

// Initialize a new sales terminal
router.post('/initialize', auth, salesTerminalController.initializeTerminal);

// Get terminal details
router.get('/:id', auth, salesTerminalController.getTerminal);

// Cart operations
router.post('/:id/cart/add', auth, salesTerminalController.addToCart);
router.post('/:id/cart/remove', auth, salesTerminalController.removeFromCart);

// Payment processing
router.post('/:id/payment', auth, salesTerminalController.processPayment);

// Void sale
router.post('/:id/void', auth, salesTerminalController.voidSale);

// Get daily statistics
router.get('/:id/stats', auth, salesTerminalController.getDailyStats);

module.exports = router;
