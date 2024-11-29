const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const Item = require('../models/Item');

// GET all items
router.get('/', authenticateToken, async (req, res) => {
    try {
        const items = await Item.find();
        res.json(items);
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ message: 'Error fetching items' });
    }
});

// POST create new item
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, category, quantity, price, description } = req.body;
        
        const newItem = new Item({
            name,
            category,
            quantity,
            price,
            description
        });

        const savedItem = await newItem.save();
        res.status(201).json(savedItem);
    } catch (error) {
        console.error('Error creating item:', error);
        res.status(500).json({ message: 'Error creating item' });
    }
});

// GET single item
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const item = await Item.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        res.json(item);
    } catch (error) {
        console.error('Error fetching item:', error);
        res.status(500).json({ message: 'Error fetching item' });
    }
});

// PUT update item
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { name, category, quantity, price, description } = req.body;
        
        const updatedItem = await Item.findByIdAndUpdate(
            req.params.id,
            {
                name,
                category,
                quantity,
                price,
                description
            },
            { new: true }
        );

        if (!updatedItem) {
            return res.status(404).json({ message: 'Item not found' });
        }

        res.json(updatedItem);
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ message: 'Error updating item' });
    }
});

// DELETE item
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const deletedItem = await Item.findByIdAndDelete(req.params.id);
        
        if (!deletedItem) {
            return res.status(404).json({ message: 'Item not found' });
        }

        res.json({ message: 'Item deleted successfully', item: deletedItem });
    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ message: 'Error deleting item' });
    }
});

// GET items by category
router.get('/category/:category', authenticateToken, async (req, res) => {
    try {
        const items = await Item.find({ category: req.params.category });
        res.json(items);
    } catch (error) {
        console.error('Error fetching items by category:', error);
        res.status(500).json({ message: 'Error fetching items by category' });
    }
});

// GET low stock items
router.get('/status/low-stock', authenticateToken, async (req, res) => {
    try {
        const lowStockThreshold = 10;
        const items = await Item.find({ quantity: { $gt: 0, $lt: lowStockThreshold } });
        res.json(items);
    } catch (error) {
        console.error('Error fetching low stock items:', error);
        res.status(500).json({ message: 'Error fetching low stock items' });
    }
});

// GET out of stock items
router.get('/status/out-of-stock', authenticateToken, async (req, res) => {
    try {
        const items = await Item.find({ quantity: 0 });
        res.json(items);
    } catch (error) {
        console.error('Error fetching out of stock items:', error);
        res.status(500).json({ message: 'Error fetching out of stock items' });
    }
});

module.exports = router;
