const Inventory = require('../models/Inventory');
const StockTransaction = require('../models/StockTransaction');
const StockAlert = require('../models/StockAlert');

class StockMonitor {
    // Calculate current stock value using different methods
    static async calculateStockValue(method = 'average') {
        const products = await Inventory.find().lean();
        let totalValue = 0;

        for (const product of products) {
            const transactions = await StockTransaction.find({ 
                product: product._id,
                type: { $in: ['purchase', 'return'] }
            })
            .sort({ createdAt: method === 'fifo' ? 1 : -1 }) // FIFO: oldest first, LIFO: newest first
            .lean();

            if (method === 'average') {
                // Calculate weighted average cost
                const totalUnits = transactions.reduce((sum, t) => sum + t.quantity, 0);
                const totalCost = transactions.reduce((sum, t) => sum + t.totalCost, 0);
                const avgCost = totalUnits > 0 ? totalCost / totalUnits : 0;
                totalValue += product.quantity * avgCost;
            } else {
                // FIFO or LIFO
                let remainingUnits = product.quantity;
                let productValue = 0;

                for (const transaction of transactions) {
                    if (remainingUnits <= 0) break;
                    
                    const units = Math.min(remainingUnits, transaction.quantity);
                    productValue += units * transaction.unitCost;
                    remainingUnits -= units;
                }

                totalValue += productValue;
            }
        }

        return totalValue;
    }

    // Check stock levels and create alerts
    static async checkStockLevels() {
        const products = await Inventory.find().lean();
        const alerts = [];

        for (const product of products) {
            // Check for low stock
            if (product.quantity <= product.minQuantity) {
                alerts.push({
                    product: product._id,
                    type: product.quantity === 0 ? 'out_of_stock' : 'low_stock',
                    level: product.quantity === 0 ? 'critical' : 'warning',
                    message: product.quantity === 0 
                        ? `${product.name} is out of stock!` 
                        : `${product.name} is running low (${product.quantity} remaining)`,
                    details: {
                        currentStock: product.quantity,
                        threshold: product.minQuantity
                    }
                });
            }

            // Check for expiring products
            if (product.batch && product.batch.expiryDate) {
                const daysToExpiry = Math.ceil((product.batch.expiryDate - new Date()) / (1000 * 60 * 60 * 24));
                
                if (daysToExpiry <= 30 && daysToExpiry > 0) {
                    alerts.push({
                        product: product._id,
                        type: 'expiring_soon',
                        level: daysToExpiry <= 7 ? 'critical' : 'warning',
                        message: `${product.name} will expire in ${daysToExpiry} days`,
                        details: {
                            daysToExpiry
                        }
                    });
                } else if (daysToExpiry <= 0) {
                    alerts.push({
                        product: product._id,
                        type: 'expired',
                        level: 'critical',
                        message: `${product.name} has expired!`,
                        details: {
                            daysToExpiry
                        }
                    });
                }
            }
        }

        // Create alerts in database
        for (const alert of alerts) {
            const existingAlert = await StockAlert.findOne({
                product: alert.product,
                type: alert.type,
                status: 'active'
            });

            if (!existingAlert) {
                const newAlert = new StockAlert(alert);
                await newAlert.save();
                await newAlert.sendNotifications(['email', 'in_app']);
            }
        }

        return alerts;
    }

    // Calculate FIFO cost for a sale
    static async calculateFIFOCost(productId, quantity) {
        const transactions = await StockTransaction.find({
            product: productId,
            type: { $in: ['purchase', 'return'] }
        })
        .sort({ createdAt: 1 }) // Oldest first
        .lean();

        let remainingUnits = quantity;
        let totalCost = 0;

        for (const transaction of transactions) {
            if (remainingUnits <= 0) break;
            
            const units = Math.min(remainingUnits, transaction.quantity);
            totalCost += units * transaction.unitCost;
            remainingUnits -= units;
        }

        return totalCost;
    }

    // Update stock levels after a sale
    static async updateStockLevels(sale) {
        for (const item of sale.items) {
            const product = await Inventory.findById(item.product);
            if (!product) continue;

            // Create stock transaction
            await StockTransaction.create({
                product: item.product,
                type: 'sale',
                quantity: -item.quantity,
                unitCost: await this.calculateFIFOCost(item.product, item.quantity) / item.quantity,
                reference: sale.saleNumber,
                referenceType: 'sale',
                referenceId: sale._id,
                performedBy: sale.salesPerson
            });

            // Update product quantity
            product.quantity -= item.quantity;
            await product.save();

            // Check stock levels
            if (product.quantity <= product.minQuantity) {
                const alert = new StockAlert({
                    product: product._id,
                    type: product.quantity === 0 ? 'out_of_stock' : 'low_stock',
                    level: product.quantity === 0 ? 'critical' : 'warning',
                    message: product.quantity === 0 
                        ? `${product.name} is out of stock!` 
                        : `${product.name} is running low (${product.quantity} remaining)`,
                    details: {
                        currentStock: product.quantity,
                        threshold: product.minQuantity
                    }
                });
                await alert.save();
                await alert.sendNotifications(['email', 'in_app']);
            }
        }
    }
}

module.exports = StockMonitor;
