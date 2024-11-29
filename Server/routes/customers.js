const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const Customer = require('../models/Customer');
const Order = require('../models/Order');

// Get all customers
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { search } = req.query;
        let query = { createdBy: req.user.id };

        if (search) {
            query = {
                ...query,
                $or: [
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                    { phone: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const customers = await Customer.find(query).sort({ lastPurchase: -1 });
        res.json({
            success: true,
            customers
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching customers',
            error: error.message
        });
    }
});

// Get customer by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const customer = await Customer.findOne({
            _id: req.params.id,
            createdBy: req.user.id
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        // Get customer's order history
        const orders = await Order.find({
            userId: req.user.id,
            customer: customer._id
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            customer,
            orders
        });
    } catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching customer',
            error: error.message
        });
    }
});

// Create new customer
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { firstName, lastName, email, phone, address, notes } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !email) {
            return res.status(400).json({
                success: false,
                message: 'First name, last name, and email are required'
            });
        }

        // Check for existing customer
        const existingCustomer = await Customer.findOne({
            createdBy: req.user.id,
            email: email.toLowerCase()
        });

        if (existingCustomer) {
            return res.status(400).json({
                success: false,
                message: 'Customer with this email already exists'
            });
        }

        const customer = new Customer({
            firstName,
            lastName,
            email: email.toLowerCase(),
            phone,
            address,
            notes,
            createdBy: req.user.id,
            totalPurchases: 0
        });

        await customer.save();

        res.status(201).json({
            success: true,
            customer
        });
    } catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating customer',
            error: error.message
        });
    }
});

// Update customer
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { firstName, lastName, email, phone, address, notes } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !email) {
            return res.status(400).json({
                success: false,
                message: 'First name, last name, and email are required'
            });
        }

        // Check for existing customer with same email
        const existingCustomer = await Customer.findOne({
            createdBy: req.user.id,
            _id: { $ne: req.params.id },
            email: email.toLowerCase()
        });

        if (existingCustomer) {
            return res.status(400).json({
                success: false,
                message: 'Another customer with this email exists'
            });
        }

        const customer = await Customer.findOneAndUpdate(
            {
                _id: req.params.id,
                createdBy: req.user.id
            },
            {
                firstName,
                lastName,
                email: email.toLowerCase(),
                phone,
                address,
                notes
            },
            { new: true }
        );

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        res.json({
            success: true,
            customer
        });
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating customer',
            error: error.message
        });
    }
});

// Delete customer
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        // Check if customer has orders
        const orderCount = await Order.countDocuments({
            userId: req.user.id,
            customer: req.params.id
        });

        if (orderCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete customer with existing orders'
            });
        }

        const customer = await Customer.findOneAndDelete({
            _id: req.params.id,
            createdBy: req.user.id
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer not found'
            });
        }

        res.json({
            success: true,
            message: 'Customer deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting customer',
            error: error.message
        });
    }
});

module.exports = router;
