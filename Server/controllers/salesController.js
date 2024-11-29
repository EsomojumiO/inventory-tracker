const Sale = require('../models/Sale');
const Inventory = require('../models/Inventory');
const Customer = require('../models/Customer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Create a new sale
exports.createSale = async (req, res) => {
    try {
        const { items, customer, subtotal, tax, discount, total, payments } = req.body;

        // Validate inventory availability
        for (const item of items) {
            const product = await Inventory.findById(item.product);
            if (!product) {
                return res.status(404).json({ message: `Product ${item.product} not found` });
            }
            if (product.quantity < item.quantity) {
                return res.status(400).json({ 
                    message: `Insufficient stock for ${product.name}. Available: ${product.quantity}`
                });
            }
        }

        // Create sale record
        const sale = new Sale({
            items: items.map(item => ({
                product: item.product,
                quantity: item.quantity,
                price: item.price,
                cost: item.cost || 0, // Default cost if not provided
                discount: item.discount || 0
            })),
            customer,
            subtotal,
            taxes: [{
                name: 'Sales Tax',
                rate: 0.1, // 10% tax rate
                amount: tax
            }],
            discounts: discount ? [{
                type: 'fixed',
                amount: discount,
                description: 'Sale discount'
            }] : [],
            total,
            paymentMethod: payments[0].method, // Primary payment method
            paymentDetails: {
                // Add payment details based on method
                transactionId: Date.now().toString()
            },
            status: 'completed'
        });

        // Calculate profit
        let totalCost = 0;
        for (const item of items) {
            const product = await Inventory.findById(item.product);
            totalCost += (product.cost || 0) * item.quantity;
        }
        sale.profit = total - totalCost;

        // Update inventory
        for (const item of items) {
            await Inventory.findByIdAndUpdate(
                item.product,
                { $inc: { quantity: -item.quantity } }
            );
        }

        // Save sale
        await sale.save();

        // Update customer purchase history
        if (customer) {
            await Customer.findByIdAndUpdate(
                customer,
                { 
                    $push: { purchases: sale._id },
                    $inc: { totalPurchases: total }
                }
            );
        }

        res.status(201).json(sale);
    } catch (error) {
        console.error('Sale creation error:', error);
        res.status(500).json({ message: 'Error creating sale', error: error.message });
    }
};

// Generate receipt
exports.generateReceipt = async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id)
            .populate('customer')
            .populate('items.product');

        if (!sale) {
            return res.status(404).json({ message: 'Sale not found' });
        }

        // Create PDF document
        const doc = new PDFDocument();
        const filename = `receipt-${sale.saleNumber}.pdf`;

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

        // Pipe PDF to response
        doc.pipe(res);

        // Add content to PDF
        doc.fontSize(20).text('Sales Receipt', { align: 'center' });
        doc.moveDown();
        
        // Business Info
        doc.fontSize(12).text('Retail Master', { align: 'left' });
        doc.fontSize(10)
            .text('123 Business Street')
            .text('City, State 12345')
            .text('Phone: (555) 555-5555')
            .moveDown();

        // Sale Info
        doc.text(`Receipt Number: ${sale.saleNumber}`)
            .text(`Date: ${sale.createdAt.toLocaleDateString()}`)
            .moveDown();

        // Customer Info
        if (sale.customer) {
            doc.text('Customer:')
                .text(sale.customer.name)
                .text(sale.customer.email)
                .moveDown();
        }

        // Items
        doc.text('Items:', { underline: true }).moveDown();
        sale.items.forEach(item => {
            doc.text(`${item.product.name} x ${item.quantity}`)
               .text(`    Price: $${item.price.toFixed(2)}`)
               .text(`    Subtotal: $${(item.price * item.quantity).toFixed(2)}`)
               .moveDown(0.5);
        });

        // Totals
        doc.moveDown()
            .text(`Subtotal: $${sale.subtotal.toFixed(2)}`, { align: 'right' });

        sale.discounts.forEach(discount => {
            doc.text(`Discount: -$${discount.amount.toFixed(2)}`, { align: 'right' });
        });

        sale.taxes.forEach(tax => {
            doc.text(`${tax.name} (${(tax.rate * 100).toFixed(0)}%): $${tax.amount.toFixed(2)}`, { align: 'right' });
        });

        doc.fontSize(12)
            .text(`Total: $${sale.total.toFixed(2)}`, { align: 'right' })
            .moveDown();

        // Payment Info
        doc.fontSize(10)
            .text(`Payment Method: ${sale.paymentMethod.charAt(0).toUpperCase() + sale.paymentMethod.slice(1)}`)
            .moveDown();

        // Thank You Message
        doc.moveDown()
            .fontSize(12)
            .text('Thank you for your business!', { align: 'center' });

        // Finalize PDF
        doc.end();

    } catch (error) {
        console.error('Receipt generation error:', error);
        res.status(500).json({ message: 'Error generating receipt', error: error.message });
    }
};

// Get all sales
exports.getAllSales = async (req, res) => {
    try {
        const sales = await Sale.find()
            .populate('customer', 'name email')
            .populate('items.product', 'name sku');
        res.json(sales);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sales', error: error.message });
    }
};

// Get sale by ID
exports.getSaleById = async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id)
            .populate('customer', 'name email')
            .populate('items.product', 'name sku');
        
        if (!sale) {
            return res.status(404).json({ message: 'Sale not found' });
        }
        
        res.json(sale);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sale', error: error.message });
    }
};

// Update sale status
exports.updateSaleStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const sale = await Sale.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        
        if (!sale) {
            return res.status(404).json({ message: 'Sale not found' });
        }
        
        res.json(sale);
    } catch (error) {
        res.status(500).json({ message: 'Error updating sale', error: error.message });
    }
};

// Get sales statistics
exports.getSalesStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const query = {};
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const stats = await Sale.aggregate([
            { $match: query },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: 1 },
                    totalRevenue: { $sum: '$total' },
                    totalProfit: { $sum: '$profit' },
                    averageOrderValue: { $avg: '$total' }
                }
            }
        ]);

        const dailySales = await Sale.aggregate([
            { $match: query },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    sales: { $sum: 1 },
                    revenue: { $sum: '$total' }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        res.json({
            summary: stats[0] || {
                totalSales: 0,
                totalRevenue: 0,
                totalProfit: 0,
                averageOrderValue: 0
            },
            dailySales
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sales statistics', error: error.message });
    }
};
