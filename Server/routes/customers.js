const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');

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
router.get('/', authenticate, async (req, res, next) => {
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
    let query = { organization: req.user.organizationId };

    // Add search filter
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } }
      ];
    }

    // Add type filter
    if (type) {
      query.type = type;
    }

    // Add status filter
    if (status) {
      query.status = status;
    }

    // Add category filter
    if (category) {
      query.category = category;
    }

    // Add location filters
    if (city) {
      query['address.city'] = city;
    }
    if (state) {
      query['address.state'] = state;
    }

    // Count total documents
    const total = await Customer.countDocuments(query);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const customers = await Customer.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    res.json({
      success: true,
      data: customers,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get customer by ID with detailed information
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      organization: req.user.organizationId
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
    next(error);
  }
});

// Create new customer
router.post('/', authenticate, upload.single('profileImage'), async (req, res, next) => {
  try {
    const customerData = { ...req.body };
    
    // Add profile image path if uploaded
    if (req.file) {
      customerData.profileImage = `/uploads/customers/${req.file.filename}`;
    }

    // Add organization information
    customerData.organization = req.user.organizationId;

    // Create customer
    const customer = new Customer(customerData);
    await customer.save();

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      customer
    });
  } catch (error) {
    next(error);
  }
});

// Update customer
router.put('/:id', authenticate, upload.single('profileImage'), async (req, res, next) => {
  try {
    const customerData = { ...req.body };
    
    // Add profile image path if uploaded
    if (req.file) {
      customerData.profileImage = `/uploads/customers/${req.file.filename}`;
    }

    // Update metadata
    customerData.updatedBy = req.user.id;

    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, organization: req.user.organizationId },
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
    next(error);
  }
});

// Add customer interaction
router.post('/:id/interactions', authenticate, async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      organization: req.user.organizationId
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
    next(error);
  }
});

// Add customer note
router.post('/:id/notes', authenticate, async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      organization: req.user.organizationId
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
    next(error);
  }
});

// Add loyalty points
router.post('/:id/loyalty-points', authenticate, async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      organization: req.user.organizationId
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
    next(error);
  }
});

// Get customer analytics
router.get('/:id/analytics', authenticate, async (req, res, next) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      organization: req.user.organizationId
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
    next(error);
  }
});

// Delete customer
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const customer = await Customer.findOneAndDelete({
      _id: req.params.id,
      organization: req.user.organizationId
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
    next(error);
  }
});

module.exports = router;
