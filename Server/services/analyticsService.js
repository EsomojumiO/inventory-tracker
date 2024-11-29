const Sale = require('../models/Sale');
const Inventory = require('../models/Inventory');
const StockTransaction = require('../models/StockTransaction');
const Customer = require('../models/Customer');
const mongoose = require('mongoose');

class AnalyticsService {
    // Sales Analytics
    static async getSalesAnalytics(startDate, endDate, groupBy = 'day') {
        try {
            const matchStage = {
                createdAt: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                },
                status: { $in: ['completed', 'partially_refunded'] }
            };

            const groupByFormat = {
                'day': { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                'week': { $dateToString: { format: '%Y-W%V', date: '$createdAt' } },
                'month': { $dateToString: { format: '%Y-%m', date: '$createdAt' } }
            };

            if (!groupByFormat[groupBy]) {
                throw new Error('Invalid groupBy parameter. Must be one of: day, week, month');
            }

            const results = await Sale.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: groupByFormat[groupBy],
                        totalSales: { $sum: '$total' },
                        totalProfit: { $sum: '$profit' },
                        averageOrderValue: { $avg: '$total' },
                        orderCount: { $sum: 1 },
                        itemsSold: { $sum: { $size: '$items' } }
                    }
                },
                { $sort: { _id: 1 } }
            ]).allowDiskUse(true);

            // Calculate growth rates with error handling for division by zero
            for (let i = 1; i < results.length; i++) {
                const previousPeriod = results[i - 1];
                const currentPeriod = results[i];
                
                currentPeriod.salesGrowth = previousPeriod.totalSales !== 0 
                    ? ((currentPeriod.totalSales - previousPeriod.totalSales) / previousPeriod.totalSales) * 100
                    : null;
                
                currentPeriod.profitGrowth = previousPeriod.totalProfit !== 0
                    ? ((currentPeriod.totalProfit - previousPeriod.totalProfit) / previousPeriod.totalProfit) * 100
                    : null;
            }

            return {
                success: true,
                data: results
            };
        } catch (error) {
            console.error('Error in getSalesAnalytics:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Product Performance Analytics
    static async getProductAnalytics(startDate, endDate) {
        const results = await Sale.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate)
                    }
                }
            },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product',
                    totalQuantity: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
                    totalProfit: { 
                        $sum: { 
                            $multiply: [
                                '$items.quantity',
                                { $subtract: ['$items.price', '$items.cost'] }
                            ]
                        }
                    },
                    averagePrice: { $avg: '$items.price' },
                    saleCount: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'inventories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' },
            {
                $project: {
                    name: '$product.name',
                    sku: '$product.sku',
                    category: '$product.category',
                    totalQuantity: 1,
                    totalRevenue: 1,
                    totalProfit: 1,
                    averagePrice: 1,
                    saleCount: 1,
                    profitMargin: {
                        $multiply: [
                            { $divide: ['$totalProfit', '$totalRevenue'] },
                            100
                        ]
                    }
                }
            },
            { $sort: { totalRevenue: -1 } }
        ]);

        return results;
    }

    // Inventory Analytics
    static async getInventoryAnalytics(userId) {
        try {
            const pipeline = [
                { $match: { userId: new mongoose.Types.ObjectId(userId) } },
                {
                    $facet: {
                        'lowStock': [
                            {
                                $match: {
                                    $expr: {
                                        $lte: ['$quantity', '$lowStockThreshold']
                                    }
                                }
                            },
                            { $count: 'count' }
                        ],
                        'outOfStock': [
                            { $match: { quantity: 0 } },
                            { $count: 'count' }
                        ],
                        'totalValue': [
                            {
                                $group: {
                                    _id: null,
                                    value: {
                                        $sum: { $multiply: ['$quantity', '$price'] }
                                    }
                                }
                            }
                        ],
                        'categoryBreakdown': [
                            {
                                $group: {
                                    _id: '$category',
                                    count: { $sum: 1 },
                                    totalValue: {
                                        $sum: { $multiply: ['$quantity', '$price'] }
                                    }
                                }
                            }
                        ]
                    }
                }
            ];

            const results = await Inventory.aggregate(pipeline).allowDiskUse(true);
            
            return {
                success: true,
                data: {
                    lowStock: results[0].lowStock[0]?.count || 0,
                    outOfStock: results[0].outOfStock[0]?.count || 0,
                    totalValue: results[0].totalValue[0]?.value || 0,
                    categoryBreakdown: results[0].categoryBreakdown || []
                }
            };
        } catch (error) {
            console.error('Error in getInventoryAnalytics:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Customer Analytics
    static async getCustomerAnalytics(startDate, endDate) {
        const results = await Sale.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate)
                    }
                }
            },
            {
                $group: {
                    _id: '$customer',
                    totalPurchases: { $sum: '$total' },
                    orderCount: { $sum: 1 },
                    averageOrderValue: { $avg: '$total' },
                    lastPurchase: { $max: '$createdAt' }
                }
            },
            {
                $lookup: {
                    from: 'customers',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'customer'
                }
            },
            { $unwind: '$customer' },
            {
                $project: {
                    name: { 
                        $concat: ['$customer.firstName', ' ', '$customer.lastName']
                    },
                    email: '$customer.email',
                    totalPurchases: 1,
                    orderCount: 1,
                    averageOrderValue: 1,
                    lastPurchase: 1,
                    loyaltyPoints: '$customer.loyaltyPoints'
                }
            },
            { $sort: { totalPurchases: -1 } }
        ]);

        return results;
    }

    // Stock Movement Analytics
    static async getStockMovementAnalytics(startDate, endDate) {
        return await StockTransaction.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate)
                    }
                }
            },
            {
                $group: {
                    _id: {
                        product: '$product',
                        type: '$type'
                    },
                    totalQuantity: { $sum: '$quantity' },
                    totalValue: { $sum: '$totalCost' },
                    transactionCount: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'inventories',
                    localField: '_id.product',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' },
            {
                $project: {
                    productName: '$product.name',
                    type: '$_id.type',
                    totalQuantity: 1,
                    totalValue: 1,
                    transactionCount: 1,
                    averageValue: { 
                        $divide: ['$totalValue', '$transactionCount']
                    }
                }
            },
            { $sort: { totalValue: -1 } }
        ]);
    }

    // Payment Analytics
    static async getPaymentAnalytics(startDate, endDate) {
        return await Sale.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(startDate),
                        $lte: new Date(endDate)
                    }
                }
            },
            {
                $group: {
                    _id: '$paymentMethod',
                    totalAmount: { $sum: '$total' },
                    transactionCount: { $sum: 1 },
                    averageAmount: { $avg: '$total' }
                }
            },
            {
                $project: {
                    paymentMethod: '$_id',
                    totalAmount: 1,
                    transactionCount: 1,
                    averageAmount: 1,
                    percentage: {
                        $multiply: [
                            { $divide: ['$transactionCount', { $sum: '$transactionCount' }] },
                            100
                        ]
                    }
                }
            },
            { $sort: { totalAmount: -1 } }
        ]);
    }

    // Get Dashboard Summary
    static async getDashboardSummary() {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        const [
            dailySales,
            totalProducts,
            lowStockCount,
            activeCustomers
        ] = await Promise.all([
            // Daily sales
            Sale.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: startOfDay,
                            $lte: endOfDay
                        },
                        status: 'completed'
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalSales: { $sum: '$total' },
                        orderCount: { $sum: 1 },
                        averageOrder: { $avg: '$total' }
                    }
                }
            ]),

            // Total products
            Inventory.countDocuments(),

            // Low stock count
            Inventory.countDocuments({
                $expr: {
                    $lte: ['$quantity', '$minQuantity']
                }
            }),

            // Active customers (made purchase in last 30 days)
            Customer.countDocuments({
                lastPurchase: {
                    $gte: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
                }
            })
        ]);

        return {
            dailySales: dailySales[0] || { totalSales: 0, orderCount: 0, averageOrder: 0 },
            totalProducts,
            lowStockCount,
            activeCustomers
        };
    }
}

module.exports = AnalyticsService;
