const express = require('express');
const router = express.Router();
const locationInventoryService = require('../services/locationInventoryService');
const auth = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validation');
const logger = require('../utils/logger');

// Get inventory for a specific location
router.get('/:locationId', 
    [auth, validateObjectId('locationId')],
    async (req, res) => {
        try {
            const inventory = await locationInventoryService.getLocationInventory(
                req.params.locationId,
                req.query
            );
            res.json(inventory);
        } catch (error) {
            logger.error('Error getting location inventory:', error);
            res.status(500).json({ message: 'Error retrieving inventory' });
        }
    }
);

// Create or update inventory item
router.post('/:locationId/products/:productId',
    [auth, validateObjectId('locationId'), validateObjectId('productId')],
    async (req, res) => {
        try {
            const inventory = await locationInventoryService.createOrUpdateInventory(
                req.params.locationId,
                req.params.productId,
                req.body
            );
            res.json(inventory);
        } catch (error) {
            logger.error('Error creating/updating inventory:', error);
            res.status(500).json({ message: 'Error updating inventory' });
        }
    }
);

// Transfer stock between locations
router.post('/transfer',
    auth,
    async (req, res) => {
        try {
            const { fromLocationId, toLocationId, productId, quantity, reference } = req.body;
            
            const result = await locationInventoryService.transferStock(
                fromLocationId,
                toLocationId,
                productId,
                quantity,
                req.user,
                reference
            );
            
            res.json(result);
        } catch (error) {
            logger.error('Error transferring stock:', error);
            res.status(400).json({ message: error.message });
        }
    }
);

// Adjust stock quantity
router.post('/:locationId/products/:productId/adjust',
    [auth, validateObjectId('locationId'), validateObjectId('productId')],
    async (req, res) => {
        try {
            const { quantity, reason } = req.body;
            
            const inventory = await locationInventoryService.adjustStock(
                req.params.locationId,
                req.params.productId,
                quantity,
                req.user,
                reason
            );
            
            res.json(inventory);
        } catch (error) {
            logger.error('Error adjusting stock:', error);
            res.status(400).json({ message: error.message });
        }
    }
);

// Record stock check
router.post('/:locationId/products/:productId/stockcheck',
    [auth, validateObjectId('locationId'), validateObjectId('productId')],
    async (req, res) => {
        try {
            const inventory = await locationInventoryService.recordStockCheck(
                req.params.locationId,
                req.params.productId,
                req.user,
                req.body.notes
            );
            res.json(inventory);
        } catch (error) {
            logger.error('Error recording stock check:', error);
            res.status(400).json({ message: error.message });
        }
    }
);

// Get stock movements history
router.get('/:locationId/products/:productId/movements',
    [auth, validateObjectId('locationId'), validateObjectId('productId')],
    async (req, res) => {
        try {
            const movements = await locationInventoryService.getStockMovements(
                req.params.locationId,
                req.params.productId,
                req.query
            );
            res.json(movements);
        } catch (error) {
            logger.error('Error getting stock movements:', error);
            res.status(400).json({ message: error.message });
        }
    }
);

// Get low stock items for a location
router.get('/:locationId/lowstock',
    [auth, validateObjectId('locationId')],
    async (req, res) => {
        try {
            const items = await locationInventoryService.getLowStockItems(
                req.params.locationId
            );
            res.json(items);
        } catch (error) {
            logger.error('Error getting low stock items:', error);
            res.status(400).json({ message: error.message });
        }
    }
);

// Reserve stock
router.post('/:locationId/products/:productId/reserve',
    [auth, validateObjectId('locationId'), validateObjectId('productId')],
    async (req, res) => {
        try {
            const { quantity, reference } = req.body;
            
            const inventory = await locationInventoryService.reserveStock(
                req.params.locationId,
                req.params.productId,
                quantity,
                reference
            );
            
            res.json(inventory);
        } catch (error) {
            logger.error('Error reserving stock:', error);
            res.status(400).json({ message: error.message });
        }
    }
);

// Release reserved stock
router.post('/:locationId/products/:productId/release',
    [auth, validateObjectId('locationId'), validateObjectId('productId')],
    async (req, res) => {
        try {
            const { quantity, reference } = req.body;
            
            const inventory = await locationInventoryService.releaseReservedStock(
                req.params.locationId,
                req.params.productId,
                quantity,
                reference
            );
            
            res.json(inventory);
        } catch (error) {
            logger.error('Error releasing reserved stock:', error);
            res.status(400).json({ message: error.message });
        }
    }
);

// Get inventory value for a location
router.get('/:locationId/value',
    [auth, validateObjectId('locationId')],
    async (req, res) => {
        try {
            const value = await locationInventoryService.getInventoryValueByLocation(
                req.params.locationId
            );
            res.json(value);
        } catch (error) {
            logger.error('Error getting inventory value:', error);
            res.status(400).json({ message: error.message });
        }
    }
);

module.exports = router;
