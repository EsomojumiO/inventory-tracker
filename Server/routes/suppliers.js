const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Get all suppliers
router.get('/',
    authenticateToken,
    async (req, res) => {
        try {
            const { 
                search, 
                status, 
                category,
                sort = 'name',
                order = 'asc',
                page = 1,
                limit = 10
            } = req.query;

            // Build query
            const query = {};
            if (search) {
                query.$or = [
                    { name: new RegExp(search, 'i') },
                    { code: new RegExp(search, 'i') },
                    { email: new RegExp(search, 'i') }
                ];
            }
            if (status) query.status = status;
            if (category) query.categories = category;

            // Execute query with pagination
            const suppliers = await Supplier.find(query)
                .sort({ [sort]: order === 'asc' ? 1 : -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .populate('categories');

            // Get total count for pagination
            const total = await Supplier.countDocuments(query);

            res.json({
                suppliers,
                total,
                pages: Math.ceil(total / limit)
            });
        } catch (error) {
            res.status(500).json({ error: 'Error fetching suppliers' });
        }
    }
);

// Get supplier by ID
router.get('/:id',
    authenticateToken,
    async (req, res) => {
        try {
            const supplier = await Supplier.findById(req.params.id)
                .populate('categories');
            
            if (!supplier) {
                return res.status(404).json({ error: 'Supplier not found' });
            }
            
            res.json(supplier);
        } catch (error) {
            res.status(500).json({ error: 'Error fetching supplier' });
        }
    }
);

// Create new supplier
router.post('/',
    authenticateToken,
    authorizeRole(['admin', 'manager']),
    async (req, res) => {
        try {
            const supplier = new Supplier(req.body);
            await supplier.save();
            res.status(201).json(supplier);
        } catch (error) {
            if (error.code === 11000) {
                return res.status(400).json({ 
                    error: 'A supplier with this code or email already exists' 
                });
            }
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors).map(err => err.message);
                return res.status(400).json({ error: messages.join(', ') });
            }
            res.status(500).json({ error: 'Error creating supplier: ' + error.message });
        }
    }
);

// Update supplier
router.put('/:id',
    authenticateToken,
    authorizeRole(['admin', 'manager']),
    async (req, res) => {
        try {
            const supplier = await Supplier.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );

            if (!supplier) {
                return res.status(404).json({ error: 'Supplier not found' });
            }

            res.json(supplier);
        } catch (error) {
            if (error.code === 11000) {
                return res.status(400).json({ 
                    error: 'Supplier with this code or email already exists' 
                });
            }
            res.status(500).json({ error: 'Error updating supplier' });
        }
    }
);

// Delete supplier
router.delete('/:id',
    authenticateToken,
    authorizeRole(['admin']),
    async (req, res) => {
        try {
            const supplier = await Supplier.findByIdAndDelete(req.params.id);
            
            if (!supplier) {
                return res.status(404).json({ error: 'Supplier not found' });
            }

            res.json({ message: 'Supplier deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Error deleting supplier' });
        }
    }
);

// Update supplier status
router.patch('/:id/status',
    authenticateToken,
    authorizeRole(['admin', 'manager']),
    async (req, res) => {
        try {
            const { status } = req.body;
            
            if (!['active', 'inactive', 'blacklisted'].includes(status)) {
                return res.status(400).json({ error: 'Invalid status' });
            }

            const supplier = await Supplier.findByIdAndUpdate(
                req.params.id,
                { status },
                { new: true }
            );

            if (!supplier) {
                return res.status(404).json({ error: 'Supplier not found' });
            }

            res.json(supplier);
        } catch (error) {
            res.status(500).json({ error: 'Error updating supplier status' });
        }
    }
);

// Update supplier credit
router.patch('/:id/credit',
    authenticateToken,
    authorizeRole(['admin']),
    async (req, res) => {
        try {
            const { creditLimit } = req.body;
            
            if (typeof creditLimit !== 'number' || creditLimit < 0) {
                return res.status(400).json({ error: 'Invalid credit limit' });
            }

            const supplier = await Supplier.findByIdAndUpdate(
                req.params.id,
                { creditLimit },
                { new: true }
            );

            if (!supplier) {
                return res.status(404).json({ error: 'Supplier not found' });
            }

            res.json(supplier);
        } catch (error) {
            res.status(500).json({ error: 'Error updating supplier credit' });
        }
    }
);

module.exports = router;
