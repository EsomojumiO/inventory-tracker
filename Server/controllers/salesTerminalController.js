const SalesTerminal = require('../models/SalesTerminal');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const Transaction = require('../models/Transaction');
const { NotFoundError, ValidationError } = require('../utils/errors');

exports.initializeTerminal = async (req, res) => {
    try {
        const { locationId } = req.body;
        const terminalId = `TERM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const terminal = await SalesTerminal.create({
            terminalId,
            location: locationId,
            settings: {
                taxRate: 0,
                enabledPaymentMethods: ['cash', 'card', 'digital'],
                printerSettings: {
                    enabled: true,
                    paperSize: 'A4'
                }
            }
        });

        res.status(201).json({ success: true, data: terminal });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.getTerminal = async (req, res) => {
    try {
        const terminal = await SalesTerminal.findById(req.params.id)
            .populate('currentCart.items.product')
            .populate('currentShift');

        if (!terminal) {
            throw new NotFoundError('Terminal not found');
        }

        res.status(200).json({ success: true, data: terminal });
    } catch (error) {
        res.status(404).json({ success: false, error: error.message });
    }
};

exports.addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const terminal = await SalesTerminal.findById(req.params.id);
        
        if (!terminal) {
            throw new NotFoundError('Terminal not found');
        }

        const product = await Product.findById(productId);
        if (!product) {
            throw new NotFoundError('Product not found');
        }

        await terminal.addToCart(productId, quantity, product.price);
        
        res.status(200).json({ success: true, data: terminal.currentCart });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.removeFromCart = async (req, res) => {
    try {
        const { productId } = req.body;
        const terminal = await SalesTerminal.findById(req.params.id);
        
        if (!terminal) {
            throw new NotFoundError('Terminal not found');
        }

        await terminal.removeFromCart(productId);
        
        res.status(200).json({ success: true, data: terminal.currentCart });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.processPayment = async (req, res) => {
    try {
        const { paymentMethod, amount } = req.body;
        const terminal = await SalesTerminal.findById(req.params.id)
            .populate('currentCart.items.product');

        if (!terminal) {
            throw new NotFoundError('Terminal not found');
        }

        // Create sale record
        const sale = await Sale.create({
            terminal: terminal._id,
            location: terminal.location,
            items: terminal.currentCart.items,
            subtotal: terminal.currentCart.subtotal,
            tax: terminal.currentCart.tax,
            total: terminal.currentCart.total,
            paymentMethod
        });

        // Create transaction record
        const transaction = await Transaction.create({
            sale: sale._id,
            amount,
            paymentMethod,
            status: 'completed'
        });

        // Update terminal stats
        await terminal.updateDailyStats(amount);
        await terminal.clearCart();

        res.status(200).json({ 
            success: true, 
            data: { sale, transaction } 
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.voidSale = async (req, res) => {
    try {
        const { saleId } = req.body;
        const terminal = await SalesTerminal.findById(req.params.id);
        
        if (!terminal) {
            throw new NotFoundError('Terminal not found');
        }

        const sale = await Sale.findById(saleId);
        if (!sale) {
            throw new NotFoundError('Sale not found');
        }

        sale.status = 'voided';
        await sale.save();

        // Update terminal stats
        terminal.dailyStats.totalSales -= sale.total;
        terminal.dailyStats.transactionCount -= 1;
        if (terminal.dailyStats.transactionCount > 0) {
            terminal.dailyStats.averageTransactionValue = 
                terminal.dailyStats.totalSales / terminal.dailyStats.transactionCount;
        } else {
            terminal.dailyStats.averageTransactionValue = 0;
        }
        await terminal.save();

        res.status(200).json({ success: true, data: sale });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

exports.getDailyStats = async (req, res) => {
    try {
        const terminal = await SalesTerminal.findById(req.params.id);
        
        if (!terminal) {
            throw new NotFoundError('Terminal not found');
        }

        res.status(200).json({ success: true, data: terminal.dailyStats });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};
