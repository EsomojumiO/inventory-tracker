const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const Sale = require('../models/Sale');
const Inventory = require('../models/Inventory');
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;
const salesController = require('../controllers/salesController');

// Get sales with filtering and pagination
router.get('/', authenticateToken, async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            category,
            productId,
            page = 1,
            limit = 50
        } = req.query;

        // Build filter object
        const filter = {};
        
        // Date filter
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        // Category filter
        if (category) {
            filter['items.product'] = {
                $in: await Inventory.find({ category }).distinct('_id')
            };
        }

        // Product filter
        if (productId) {
            filter['items.product'] = productId;
        }

        // Execute query with pagination
        const skip = (page - 1) * limit;
        const sales = await Sale.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('items.product', 'name price category')
            .lean();

        // Get total count for pagination
        const total = await Sale.countDocuments(filter);

        // Calculate summary statistics
        const summary = {
            totalSales: total,
            totalRevenue: sales.reduce((sum, sale) => sum + sale.total, 0),
            averageOrderValue: sales.length > 0 
                ? sales.reduce((sum, sale) => sum + sale.total, 0) / sales.length 
                : 0
        };

        res.json({
            success: true,
            sales,
            summary,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching sales:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sales data',
            error: error.message
        });
    }
});

// Create new sale
router.post('/', authenticateToken, async (req, res) => {
    const session = await Sale.startSession();
    session.startTransaction();

    try {
        const { items, customer, paymentMethod, notes } = req.body;

        // Validate items array
        if (!Array.isArray(items) || items.length === 0) {
            throw new Error('Items array is required and cannot be empty');
        }

        // Check stock and update inventory
        for (const item of items) {
            const product = await Inventory.findById(item.product).session(session);
            if (!product) {
                throw new Error(`Product not found: ${item.product}`);
            }
            if (product.quantity < item.quantity) {
                throw new Error(`Insufficient stock for product: ${product.name}`);
            }
            
            // Update inventory
            product.quantity -= item.quantity;
            await product.save({ session });

            // Check for low stock
            if (product.quantity <= product.minQuantity) {
                console.log(`Low stock alert for ${product.name}: ${product.quantity} units remaining`);
                // Here you would typically trigger a notification
            }
        }

        // Create sale record
        const sale = new Sale({
            items,
            customer,
            paymentMethod,
            notes
        });

        await sale.save({ session });
        await session.commitTransaction();

        // Populate product details for response
        const populatedSale = await Sale.findById(sale._id)
            .populate('items.product', 'name price');

        res.status(201).json({
            success: true,
            sale: populatedSale
        });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({
            success: false,
            message: 'Error creating sale',
            error: error.message
        });
    } finally {
        session.endSession();
    }
});

// Get sales report
router.get('/report', authenticateToken, async (req, res) => {
    try {
        const { period, format } = req.query;
        const now = new Date();
        let startDate = new Date();
        
        // Set time period
        switch (period) {
            case 'daily':
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'weekly':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'monthly':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'custom':
                if (!req.query.startDate) {
                    return res.status(400).json({
                        success: false,
                        message: 'Start date is required for custom period'
                    });
                }
                startDate = new Date(req.query.startDate);
                if (isNaN(startDate.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid start date format'
                    });
                }
                break;
            default:
                startDate.setHours(0, 0, 0, 0); // Default to daily
        }

        // Get sales data
        const sales = await Sale.find({
            createdAt: { $gte: startDate, $lte: now }
        })
        .populate('items.product', 'name price category')
        .lean();

        // Calculate report data
        const reportData = {
            period: {
                start: startDate,
                end: now
            },
            summary: {
                totalSales: sales.length,
                totalRevenue: sales.reduce((sum, sale) => sum + sale.total, 0),
                averageOrderValue: sales.length > 0 
                    ? sales.reduce((sum, sale) => sum + sale.total, 0) / sales.length 
                    : 0
            },
            salesByCategory: {},
            salesByProduct: {},
            salesByDay: {}
        };

        // Process sales data
        sales.forEach(sale => {
            // Group by category
            sale.items.forEach(item => {
                if (!item.product) return; // Skip if product is missing
                
                const category = item.product.category || 'Uncategorized';
                if (!reportData.salesByCategory[category]) {
                    reportData.salesByCategory[category] = {
                        count: 0,
                        revenue: 0
                    };
                }
                reportData.salesByCategory[category].count += item.quantity;
                reportData.salesByCategory[category].revenue += item.quantity * item.price;

                // Group by product
                const productId = item.product._id.toString();
                if (!reportData.salesByProduct[productId]) {
                    reportData.salesByProduct[productId] = {
                        name: item.product.name,
                        count: 0,
                        revenue: 0
                    };
                }
                reportData.salesByProduct[productId].count += item.quantity;
                reportData.salesByProduct[productId].revenue += item.quantity * item.price;
            });

            // Group by day
            const day = sale.createdAt.toISOString().split('T')[0];
            if (!reportData.salesByDay[day]) {
                reportData.salesByDay[day] = {
                    count: 0,
                    revenue: 0
                };
            }
            reportData.salesByDay[day].count++;
            reportData.salesByDay[day].revenue += sale.total;
        });

        // Format response based on requested format
        if (format === 'csv') {
            try {
                const csvStringifier = createCsvStringifier({
                    header: [
                        {id: 'date', title: 'Date'},
                        {id: 'salesCount', title: 'Number of Sales'},
                        {id: 'revenue', title: 'Revenue'},
                        {id: 'averageOrderValue', title: 'Average Order Value'}
                    ]
                });

                const records = Object.entries(reportData.salesByDay).map(([date, data]) => ({
                    date,
                    salesCount: data.count,
                    revenue: data.revenue.toFixed(2),
                    averageOrderValue: (data.revenue / data.count).toFixed(2)
                }));

                const csvContent = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
                
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename=sales-report-${period}-${new Date().toISOString().split('T')[0]}.csv`);
                return res.send(csvContent);
            } catch (error) {
                console.error('CSV generation error:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error generating CSV report',
                    error: error.message
                });
            }
        }

        // Return JSON format
        res.json({
            success: true,
            data: reportData
        });
    } catch (error) {
        console.error('Report generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating report',
            error: error.message
        });
    }
});

// Dashboard endpoint
router.get('/dashboard', authenticateToken, async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const sales = await Sale.find({
            userId: req.user.id,
            createdAt: { $gte: thirtyDaysAgo }
        })
        .populate('items.product', 'name category')
        .sort('-createdAt');

        res.json({
            success: true,
            sales: sales.map(sale => ({
                _id: sale._id,
                items: sale.items.map(item => ({
                    product: {
                        _id: item.product._id,
                        name: item.product.name,
                        category: item.product.category
                    },
                    quantity: item.quantity,
                    price: item.price
                })),
                total: sale.total,
                createdAt: sale.createdAt
            }))
        });
    } catch (error) {
        console.error('Error fetching dashboard sales:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching sales data',
            error: error.message
        });
    }
});

// Get a single sale
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id)
            .populate('items.product', 'name price category');
        
        if (!sale) {
            return res.status(404).json({
                success: false,
                message: 'Sale not found'
            });
        }

        res.json({
            success: true,
            sale
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching sale',
            error: error.message
        });
    }
});

// Generate receipt
router.get('/receipt/:id', authenticateToken, salesController.generateReceipt);

// Get sales statistics
router.get('/stats', authenticateToken, salesController.getSalesStats);

// Update sale status
router.patch('/:id/status', authenticateToken, salesController.updateSaleStatus);

module.exports = router;
