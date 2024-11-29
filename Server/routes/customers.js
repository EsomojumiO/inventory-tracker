const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const Customer = require('../models/Customer');
const Order = require('../models/Order');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/customers');
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
  }
});

// Get all customers with advanced filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      search,
      type,
      status,
      category,
      city,
      state,
      sortBy = 'lastPurchaseDate',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    // Build query
    let query = { createdBy: req.user.id };

    // Search across multiple fields
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } }
      ];
    }

    // Apply filters
    if (type) query.type = type;
    if (status) query.status = status;
    if (category) query.category = category;
    if (city) query['address.city'] = city;
    if (state) query['address.state'] = state;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with sorting and pagination
    const customers = await Customer.find(query)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-communications -notes -interactions');

    // Get total count for pagination
    const total = await Customer.countDocuments(query);

    res.json({
      success: true,
      customers,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
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

// Get customer by ID with detailed information
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    }).populate('createdBy', 'username');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get customer's order history
    const orders = await Order.find({
      customer: customer._id
    })
    .sort({ createdAt: -1 })
    .populate('items.product', 'name price');

    // Get recent interactions
    const recentInteractions = customer.getRecentInteractions(5);

    res.json({
      success: true,
      customer,
      orders,
      recentInteractions
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
router.post('/', authenticateToken, upload.single('profileImage'), async (req, res) => {
  try {
    const customerData = { ...req.body };
    
    // Add profile image path if uploaded
    if (req.file) {
      customerData.profileImage = `/uploads/customers/${req.file.filename}`;
    }

    // Add creator information
    customerData.createdBy = req.user.id;
    customerData.updatedBy = req.user.id;

    // Create customer
    const customer = new Customer(customerData);
    await customer.save();

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
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
router.put('/:id', authenticateToken, upload.single('profileImage'), async (req, res) => {
  try {
    const customerData = { ...req.body };
    
    // Add profile image path if uploaded
    if (req.file) {
      customerData.profileImage = `/uploads/customers/${req.file.filename}`;
    }

    // Update metadata
    customerData.updatedBy = req.user.id;

    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      customerData,
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
      message: 'Customer updated successfully',
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

// Add customer interaction
router.post('/:id/interactions', authenticateToken, async (req, res) => {
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

    const interaction = {
      ...req.body,
      createdBy: req.user.id
    };

    const newInteraction = await customer.addInteraction(interaction);

    res.status(201).json({
      success: true,
      message: 'Interaction added successfully',
      interaction: newInteraction
    });
  } catch (error) {
    console.error('Error adding interaction:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding interaction',
      error: error.message
    });
  }
});

// Add customer note
router.post('/:id/notes', authenticateToken, async (req, res) => {
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

    customer.notes.push({
      ...req.body,
      createdBy: req.user.id
    });

    await customer.save();

    res.status(201).json({
      success: true,
      message: 'Note added successfully',
      note: customer.notes[customer.notes.length - 1]
    });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding note',
      error: error.message
    });
  }
});

// Add loyalty points
router.post('/:id/loyalty-points', authenticateToken, async (req, res) => {
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

    const { points, reason } = req.body;
    const newPoints = await customer.addLoyaltyPoints(points, reason);

    res.json({
      success: true,
      message: 'Loyalty points added successfully',
      loyaltyPoints: newPoints,
      loyaltyTier: customer.loyaltyTier
    });
  } catch (error) {
    console.error('Error adding loyalty points:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding loyalty points',
      error: error.message
    });
  }
});

// Get customer analytics
router.get('/:id/analytics', authenticateToken, async (req, res) => {
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

    // Get orders for the last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const orders = await Order.find({
      customer: customer._id,
      createdAt: { $gte: twelveMonthsAgo }
    }).select('total createdAt items');

    // Calculate monthly purchase trends
    const monthlyTrends = new Array(12).fill(0);
    orders.forEach(order => {
      const monthIndex = order.createdAt.getMonth();
      monthlyTrends[monthIndex] += order.total;
    });

    // Calculate frequently purchased items
    const itemFrequency = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        itemFrequency[item.product] = (itemFrequency[item.product] || 0) + item.quantity;
      });
    });

    res.json({
      success: true,
      analytics: {
        totalOrders: customer.totalPurchases,
        totalSpent: customer.totalSpent,
        averageOrderValue: customer.averageOrderValue,
        loyaltyPoints: customer.loyaltyPoints,
        loyaltyTier: customer.loyaltyTier,
        monthlyTrends,
        itemFrequency: Object.entries(itemFrequency)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
      }
    });
  } catch (error) {
    console.error('Error fetching customer analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer analytics',
      error: error.message
    });
  }
});

// Delete customer
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
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
