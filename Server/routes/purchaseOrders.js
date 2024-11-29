const express = require('express');
const router = express.Router();
const PurchaseOrder = require('../models/PurchaseOrder');
const Supplier = require('../models/Supplier');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Get all purchase orders
router.get('/',
    authenticateToken,
    async (req, res) => {
        try {
            const {
                search,
                status,
                supplier,
                startDate,
                endDate,
                sort = 'orderDate',
                order = 'desc',
                page = 1,
                limit = 10
            } = req.query;

            // Build query
            const query = {};
            if (search) {
                query.$or = [
                    { orderNumber: new RegExp(search, 'i') }
                ];
            }
            if (status) query.status = status;
            if (supplier) query.supplier = supplier;
            if (startDate || endDate) {
                query.orderDate = {};
                if (startDate) query.orderDate.$gte = new Date(startDate);
                if (endDate) query.orderDate.$lte = new Date(endDate);
            }

            // Execute query with pagination
            const orders = await PurchaseOrder.find(query)
                .sort({ [sort]: order === 'asc' ? 1 : -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .populate('supplier', 'name code')
                .populate('items.product', 'name sku');

            // Get total count for pagination
            const total = await PurchaseOrder.countDocuments(query);

            res.json({
                orders,
                total,
                pages: Math.ceil(total / limit)
            });
        } catch (error) {
            res.status(500).json({ error: 'Error fetching purchase orders' });
        }
    }
);

// Get purchase order by ID
router.get('/:id',
    authenticateToken,
    async (req, res) => {
        try {
            const order = await PurchaseOrder.findById(req.params.id)
                .populate('supplier')
                .populate('items.product')
                .populate('history.user', 'name email');

            if (!order) {
                return res.status(404).json({ error: 'Purchase order not found' });
            }

            res.json(order);
        } catch (error) {
            res.status(500).json({ error: 'Error fetching purchase order' });
        }
    }
);

// Create new purchase order
router.post('/',
    authenticateToken,
    authorizeRole(['admin', 'manager']),
    async (req, res) => {
        try {
            // Check supplier credit limit if not a draft
            if (req.body.status !== 'draft') {
                const supplier = await Supplier.findById(req.body.supplier);
                if (!supplier) {
                    return res.status(400).json({ error: 'Supplier not found' });
                }

                const orderTotal = req.body.items.reduce((sum, item) => 
                    sum + (item.quantity * item.unitPrice), 0);

                if (!supplier.hasAvailableCredit(orderTotal)) {
                    return res.status(400).json({ 
                        error: 'Order exceeds supplier credit limit' 
                    });
                }
            }

            const order = new PurchaseOrder({
                ...req.body,
                history: [{
                    status: req.body.status || 'draft',
                    date: new Date(),
                    user: req.user._id,
                    notes: 'Purchase order created'
                }]
            });

            await order.save();
            res.status(201).json(order);
        } catch (error) {
            res.status(500).json({ error: 'Error creating purchase order' });
        }
    }
);

// Update purchase order
router.put('/:id',
    authenticateToken,
    authorizeRole(['admin', 'manager']),
    async (req, res) => {
        try {
            const order = await PurchaseOrder.findById(req.params.id);
            if (!order) {
                return res.status(404).json({ error: 'Purchase order not found' });
            }

            // Prevent modification of received orders
            if (order.status === 'received') {
                return res.status(400).json({ 
                    error: 'Cannot modify received purchase orders' 
                });
            }

            // Check supplier credit limit if status is being changed from draft
            if (order.status === 'draft' && req.body.status !== 'draft') {
                const supplier = await Supplier.findById(order.supplier);
                const orderTotal = req.body.items.reduce((sum, item) => 
                    sum + (item.quantity * item.unitPrice), 0);

                if (!supplier.hasAvailableCredit(orderTotal)) {
                    return res.status(400).json({ 
                        error: 'Order exceeds supplier credit limit' 
                    });
                }
            }

            Object.assign(order, req.body);
            await order.save();
            res.json(order);
        } catch (error) {
            res.status(500).json({ error: 'Error updating purchase order' });
        }
    }
);

// Update purchase order status
router.patch('/:id/status',
    authenticateToken,
    authorizeRole(['admin', 'manager']),
    async (req, res) => {
        try {
            const { status, notes } = req.body;
            const order = await PurchaseOrder.findById(req.params.id);

            if (!order) {
                return res.status(404).json({ error: 'Purchase order not found' });
            }

            await order.addStatusHistory(status, req.user._id, notes);
            res.json(order);
        } catch (error) {
            res.status(500).json({ error: 'Error updating purchase order status' });
        }
    }
);

// Receive purchase order
router.post('/:id/receive',
    authenticateToken,
    authorizeRole(['admin', 'manager']),
    async (req, res) => {
        try {
            const { receivedItems } = req.body;
            const order = await PurchaseOrder.findById(req.params.id);

            if (!order) {
                return res.status(404).json({ error: 'Purchase order not found' });
            }

            if (order.status === 'received') {
                return res.status(400).json({ 
                    error: 'Order has already been received' 
                });
            }

            // Update received quantities
            order.items.forEach(item => {
                const receivedItem = receivedItems.find(
                    ri => ri.productId === item.product.toString()
                );
                if (receivedItem) {
                    item.receivedQuantity = receivedItem.quantity;
                }
            });

            await order.receiveOrder();
            res.json(order);
        } catch (error) {
            res.status(500).json({ error: 'Error receiving purchase order' });
        }
    }
);

// Delete purchase order
router.delete('/:id',
    authenticateToken,
    authorizeRole(['admin']),
    async (req, res) => {
        try {
            const order = await PurchaseOrder.findById(req.params.id);
            
            if (!order) {
                return res.status(404).json({ error: 'Purchase order not found' });
            }

            if (order.status !== 'draft') {
                return res.status(400).json({ 
                    error: 'Only draft orders can be deleted' 
                });
            }

            await order.remove();
            res.json({ message: 'Purchase order deleted successfully' });
        } catch (error) {
            res.status(500).json({ error: 'Error deleting purchase order' });
        }
    }
);

module.exports = router;
