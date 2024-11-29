const Order = require('../models/Order');
const Inventory = require('../models/Inventory');
const PDFDocument = require('pdfkit');
const jwt = require('jsonwebtoken');

// Create new order
async function createOrder(req, res) {
    const session = await Order.startSession();
    session.startTransaction();

    try {
        const { items, customer, payment, shipping, notes, status } = req.body;

        // Validate inventory availability
        for (const item of items) {
            const product = await Inventory.findById(item.product).session(session);
            if (!product) {
                throw new Error(`Product ${item.product} not found`);
            }
            if (product.quantity < item.quantity) {
                throw new Error(`Insufficient stock for ${product.name}`);
            }
        }

        // Generate order number
        const orderNumber = await Order.generateOrderNumber();

        // Create order
        const order = new Order({
            orderNumber,
            source: 'POS',
            type: 'IN_STORE',
            status,
            customer,
            items,
            payment,
            shipping,
            notes,
            processedBy: req.user._id
        });

        // Update inventory
        for (const item of items) {
            await Inventory.findByIdAndUpdate(
                item.product,
                { $inc: { quantity: -item.quantity } },
                { session }
            );
        }

        await order.save({ session });
        await session.commitTransaction();

        res.status(201).json({
            success: true,
            order
        });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({
            success: false,
            message: error.message
        });
    } finally {
        session.endSession();
    }
};

// Get orders with filtering and pagination
async function getOrders(req, res) {
    try {
        const {
            status,
            startDate,
            endDate,
            search,
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build query
        const query = {};
        
        // Status filter
        if (status && status !== 'all') {
            query.status = status;
        }
        
        // Date range filter
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                const start = new Date(startDate);
                if (!isNaN(start.getTime())) {
                    query.createdAt.$gte = start;
                }
            }
            if (endDate) {
                const end = new Date(endDate);
                if (!isNaN(end.getTime())) {
                    query.createdAt.$lte = end;
                }
            }
        }

        // Search filter
        if (search) {
            query.$or = [
                { orderNumber: new RegExp(search, 'i') },
                { 'customer.name': new RegExp(search, 'i') },
                { 'customer.email': new RegExp(search, 'i') },
                { 'customer.phone': new RegExp(search, 'i') }
            ];
        }

        // Validate pagination params
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        // Build sort object
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Execute query with pagination
        const orders = await Order.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(limitNum)
            .populate('items.product', 'name sku price')
            .populate('processedBy', 'name email')
            .lean();

        // Get total count for pagination
        const total = await Order.countDocuments(query);

        // Calculate totals
        const orderTotals = orders.map(order => {
            const subtotal = order.items.reduce((sum, item) => {
                return sum + (item.price * item.quantity);
            }, 0);
            const tax = (subtotal * (order.tax || 0.075)); // Default to 7.5% if not specified
            const total = subtotal + tax;
            
            return {
                ...order,
                subtotal: Math.round(subtotal * 100) / 100,
                tax: Math.round(tax * 100) / 100,
                total: Math.round(total * 100) / 100
            };
        });

        res.json({
            success: true,
            orders: orderTotals,
            pagination: {
                total,
                page: pageNum,
                pages: Math.ceil(total / limitNum),
                limit: limitNum
            }
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            error: error.message
        });
    }
};

// Get order by ID
async function getOrderById(req, res) {
    try {
        const order = await Order.findById(req.params.id)
            .populate('items.product', 'name sku price')
            .lean();

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.json({
            success: true,
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update order status
async function updateOrderStatus(req, res) {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        await order.updateStatus(status, req.user._id);

        res.json({
            success: true,
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update shipping information
async function updateShipping(req, res) {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        await order.addTrackingInfo(req.body);

        res.json({
            success: true,
            order
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Generate document (invoice, receipt, quotation)
async function generateDocument(req, res) {
    try {
        const { id, type } = req.params;
        const order = await Order.findById(id).populate('items.product');
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${type}_${order.orderNumber}.pdf`);
        doc.pipe(res);

        // Add letterhead
        doc.fontSize(20).text('Retail Master', { align: 'center' });
        doc.fontSize(12).text(`${type.toUpperCase()}`, { align: 'center' });
        doc.moveDown();

        // Add order details
        doc.fontSize(12).text(`Order Number: ${order.orderNumber}`);
        doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
        doc.moveDown();

        // Add customer details
        if (order.customer) {
            doc.text('Customer Information:');
            doc.text(`Name: ${order.customer.name || 'N/A'}`);
            doc.text(`Email: ${order.customer.email || 'N/A'}`);
            doc.text(`Phone: ${order.customer.phone || 'N/A'}`);
            doc.moveDown();
        }

        // Add items table
        doc.text('Items:', { underline: true });
        const tableTop = doc.y + 10;
        let position = tableTop;

        // Table headers
        doc.text('Item', 50, position);
        doc.text('Qty', 250, position);
        doc.text('Price', 350, position);
        doc.text('Total', 450, position);
        position += 20;

        // Table rows
        order.items.forEach(item => {
            doc.text(item.name, 50, position);
            doc.text(item.quantity.toString(), 250, position);
            doc.text(`₦${item.price.toFixed(2)}`, 350, position);
            doc.text(`₦${(item.price * item.quantity).toFixed(2)}`, 450, position);
            position += 20;
        });

        doc.moveDown();
        position += 20;

        // Add totals
        doc.text(`Subtotal: ₦${order.subtotal.toFixed(2)}`, { align: 'right' });
        doc.text(`Tax: ₦${order.tax.toFixed(2)}`, { align: 'right' });
        if (order.discount > 0) {
            doc.text(`Discount: ₦${order.discount.toFixed(2)}`, { align: 'right' });
        }
        doc.text(`Total: ₦${order.total.toFixed(2)}`, { align: 'right' });

        // Add footer
        doc.moveDown();
        doc.fontSize(10).text('Thank you for your business!', { align: 'center' });

        doc.end();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// Generate manual document
async function generateManualDocument(req, res) {
    try {
        const { type, orderData } = req.body;
        
        if (!orderData) {
            return res.status(400).json({
                success: false,
                message: 'Order data is required'
            });
        }

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${type}_manual_${Date.now()}.pdf`);
        doc.pipe(res);

        // Add letterhead
        doc.fontSize(20).text('Retail Master', { align: 'center' });
        doc.fontSize(12).text(`${type.toUpperCase()}`, { align: 'center' });
        doc.moveDown();

        // Add order details
        doc.fontSize(12).text(`Date: ${new Date().toLocaleDateString()}`);
        doc.moveDown();

        // Add customer details if provided
        if (orderData.customer) {
            doc.text('Customer Information:');
            doc.text(`Name: ${orderData.customer.name || 'N/A'}`);
            doc.text(`Email: ${orderData.customer.email || 'N/A'}`);
            doc.text(`Phone: ${orderData.customer.phone || 'N/A'}`);
            doc.moveDown();
        }

        // Add items table
        doc.text('Items:', { underline: true });
        const tableTop = doc.y + 10;
        let position = tableTop;

        // Table headers
        doc.text('Item', 50, position);
        doc.text('Qty', 250, position);
        doc.text('Price', 350, position);
        doc.text('Total', 450, position);
        position += 20;

        // Table rows
        orderData.items.forEach(item => {
            doc.text(item.name, 50, position);
            doc.text(item.quantity.toString(), 250, position);
            doc.text(`₦${item.price.toFixed(2)}`, 350, position);
            doc.text(`₦${(item.price * item.quantity).toFixed(2)}`, 450, position);
            position += 20;
        });

        doc.moveDown();
        position += 20;

        // Add totals
        const subtotal = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * 0.075; // 7.5% VAT
        const total = subtotal + tax;

        doc.text(`Subtotal: ₦${subtotal.toFixed(2)}`, { align: 'right' });
        doc.text(`Tax (7.5%): ₦${tax.toFixed(2)}`, { align: 'right' });
        if (orderData.discount) {
            doc.text(`Discount: ₦${orderData.discount.toFixed(2)}`, { align: 'right' });
        }
        doc.text(`Total: ₦${total.toFixed(2)}`, { align: 'right' });

        // Add footer
        doc.moveDown();
        doc.fontSize(10).text('Thank you for your business!', { align: 'center' });

        doc.end();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

// Create manual order
async function createManualOrder(req, res) {
    const session = await Order.startSession();
    session.startTransaction();

    try {
        const { items, customer, payment, shipping, notes, status } = req.body;

        // Generate order number
        const orderNumber = await Order.generateOrderNumber();

        // Create order
        const order = new Order({
            orderNumber,
            source: 'MANUAL',
            type: 'MANUAL',
            status: status || 'PENDING',
            customer,
            items,
            payment,
            shipping,
            notes,
            processedBy: req.user._id
        });

        await order.save({ session });
        await session.commitTransaction();

        res.status(201).json({
            success: true,
            order
        });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({
            success: false,
            message: error.message
        });
    } finally {
        session.endSession();
    }
}

// Generate invoice
async function generateInvoice(req, res) {
    try {
        const order = await Order.findById(req.params.id)
            .populate('items.product', 'name sku price')
            .lean();

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Create PDF document
        const doc = new PDFDocument();
        
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderNumber}.pdf`);

        // Pipe PDF to response
        doc.pipe(res);

        // Add content to PDF
        doc.fontSize(20).text('Invoice', { align: 'center' });
        doc.moveDown();

        // Business Info
        doc.fontSize(12).text('Retail Master', { align: 'left' });
        doc.fontSize(10)
            .text('123 Business Street')
            .text('City, State 12345')
            .text('Phone: (555) 555-5555')
            .moveDown();

        // Order Info
        doc.text(`Order Number: ${order.orderNumber}`)
            .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`)
            .moveDown();

        // Customer Info
        doc.text('Bill To:')
            .text(order.customer.name)
            .text(order.customer.email || '')
            .text(order.customer.phone || '')
            .moveDown();

        // Items
        doc.text('Items:', { underline: true }).moveDown();
        order.items.forEach(item => {
            doc.text(`${item.product.name} x ${item.quantity}`)
               .text(`    Price: $${item.price.toFixed(2)}`)
               .text(`    Total: $${(item.price * item.quantity).toFixed(2)}`)
               .moveDown(0.5);
        });

        // Totals
        doc.moveDown()
            .text(`Subtotal: $${order.subtotal.toFixed(2)}`, { align: 'right' });

        if (order.discount > 0) {
            doc.text(`Discount: -$${order.discount.toFixed(2)}`, { align: 'right' });
        }

        doc.text(`Tax: $${order.tax.toFixed(2)}`, { align: 'right' });

        if (order.shipping > 0) {
            doc.text(`Shipping: $${order.shipping.toFixed(2)}`, { align: 'right' });
        }

        doc.fontSize(12)
            .text(`Total: $${order.total.toFixed(2)}`, { align: 'right' })
            .moveDown();

        // Payment Info
        doc.fontSize(10)
            .text(`Payment Method: ${order.payment.method}`)
            .text(`Payment Status: ${order.payment.status}`)
            .moveDown();

        // Thank You Message
        doc.moveDown()
            .fontSize(12)
            .text('Thank you for your business!', { align: 'center' });

        // Finalize PDF
        doc.end();

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get order statistics
async function getOrderStats(req, res) {
    try {
        const { startDate, endDate } = req.query;
        
        const query = {};
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const stats = await Order.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: '$total' },
                    averageOrderValue: { $avg: '$total' },
                    pendingOrders: {
                        $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] }
                    },
                    completedOrders: {
                        $sum: { $cond: [{ $eq: ['$status', 'DELIVERED'] }, 1, 0] }
                    }
                }
            }
        ]);

        const dailyOrders = await Order.aggregate([
            { $match: query },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    orders: { $sum: 1 },
                    revenue: { $sum: '$total' }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        res.json({
            success: true,
            stats: stats[0] || {
                totalOrders: 0,
                totalRevenue: 0,
                averageOrderValue: 0,
                pendingOrders: 0,
                completedOrders: 0
            },
            dailyOrders
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus,
    updateShipping,
    generateDocument,
    generateManualDocument,
    createManualOrder,
    generateInvoice,
    getOrderStats
};
