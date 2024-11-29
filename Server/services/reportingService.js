const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Employee = require('../models/Employee');

class ReportingService {
  // Financial Reports
  async getFinancialSummary(startDate, endDate) {
    const [income, expenses] = await Promise.all([
      Transaction.getIncomeByPeriod(startDate, endDate),
      Transaction.getExpensesByPeriod(startDate, endDate)
    ]);

    const totalIncome = income.reduce((sum, item) => sum + item.total, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + item.total, 0);
    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    return {
      period: { startDate, endDate },
      income: {
        total: totalIncome,
        breakdown: income
      },
      expenses: {
        total: totalExpenses,
        breakdown: expenses
      },
      netProfit,
      profitMargin,
      taxLiability: this.calculateTaxLiability(netProfit)
    };
  }

  async getDailyReport(date) {
    const transactions = await Transaction.getDailyTransactions(date);
    const orders = await Order.getDailyOrders(date);
    
    const sales = orders.reduce((sum, order) => sum + order.total, 0);
    const expenses = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      date,
      sales,
      expenses,
      netProfit: sales - expenses,
      orderCount: orders.length,
      averageOrderValue: orders.length > 0 ? sales / orders.length : 0,
      paymentMethods: this.groupByPaymentMethod(transactions)
    };
  }

  // Sales Analytics
  async getTopSellingProducts(startDate, endDate, limit = 10) {
    return Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'COMPLETED'
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          averagePrice: { $avg: '$items.price' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: limit }
    ]);
  }

  async getSalesPerformance(startDate, endDate, groupBy = 'day') {
    const groupByOptions = {
      day: {
        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
      },
      week: {
        $dateToString: { format: '%Y-W%V', date: '$createdAt' }
      },
      month: {
        $dateToString: { format: '%Y-%m', date: '$createdAt' }
      }
    };

    return Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: 'COMPLETED'
        }
      },
      {
        $group: {
          _id: groupByOptions[groupBy],
          totalSales: { $sum: '$total' },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: '$total' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
  }

  // Inventory Analytics
  async getInventoryMetrics() {
    return Product.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$price', '$stockQuantity'] } },
          lowStock: {
            $sum: {
              $cond: [{ $lte: ['$stockQuantity', '$reorderPoint'] }, 1, 0]
            }
          },
          outOfStock: {
            $sum: {
              $cond: [{ $eq: ['$stockQuantity', 0] }, 1, 0]
            }
          }
        }
      }
    ]);
  }

  async getInventoryTurnover(startDate, endDate) {
    const [sales, averageInventory] = await Promise.all([
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: 'COMPLETED'
          }
        },
        { $unwind: '$items' },
        {
          $group: {
            _id: null,
            totalCogs: {
              $sum: {
                $multiply: ['$items.quantity', '$items.cost']
              }
            }
          }
        }
      ]),
      Product.aggregate([
        {
          $group: {
            _id: null,
            totalValue: {
              $sum: { $multiply: ['$price', '$stockQuantity'] }
            }
          }
        }
      ])
    ]);

    const cogs = sales[0]?.totalCogs || 0;
    const inventory = averageInventory[0]?.totalValue || 0;
    
    return {
      turnoverRatio: inventory > 0 ? cogs / inventory : 0,
      averageInventory: inventory,
      cogs
    };
  }

  // Employee Performance
  async getEmployeePerformance(startDate, endDate) {
    return Employee.aggregate([
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'employee',
          as: 'sales'
        }
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          role: 1,
          totalSales: {
            $reduce: {
              input: {
                $filter: {
                  input: '$sales',
                  as: 'sale',
                  cond: {
                    $and: [
                      { $gte: ['$$sale.createdAt', startDate] },
                      { $lte: ['$$sale.createdAt', endDate] }
                    ]
                  }
                }
              },
              initialValue: 0,
              in: { $add: ['$$value', '$$this.total'] }
            }
          },
          orderCount: {
            $size: {
              $filter: {
                input: '$sales',
                as: 'sale',
                cond: {
                  $and: [
                    { $gte: ['$$sale.createdAt', startDate] },
                    { $lte: ['$$sale.createdAt', endDate] }
                  ]
                }
              }
            }
          }
        }
      },
      {
        $addFields: {
          averageOrderValue: {
            $cond: [
              { $gt: ['$orderCount', 0] },
              { $divide: ['$totalSales', '$orderCount'] },
              0
            ]
          }
        }
      },
      { $sort: { totalSales: -1 } }
    ]);
  }

  // Tax Calculations
  calculateTaxLiability(profit, taxYear = new Date().getFullYear()) {
    // Nigerian Corporate Tax Rates (simplified)
    const SMALL_BUSINESS_THRESHOLD = 25000000; // 25 million NGN
    const MEDIUM_BUSINESS_THRESHOLD = 100000000; // 100 million NGN
    
    const taxRates = {
      small: 0.20, // 20% for small businesses
      medium: 0.30, // 30% for medium businesses
      large: 0.35 // 35% for large businesses
    };

    let taxRate;
    if (profit <= SMALL_BUSINESS_THRESHOLD) {
      taxRate = taxRates.small;
    } else if (profit <= MEDIUM_BUSINESS_THRESHOLD) {
      taxRate = taxRates.medium;
    } else {
      taxRate = taxRates.large;
    }

    return {
      profit,
      taxRate,
      taxAmount: profit * taxRate,
      taxYear
    };
  }

  // Utility Methods
  groupByPaymentMethod(transactions) {
    return transactions.reduce((acc, transaction) => {
      const method = transaction.paymentMethod;
      if (!acc[method]) {
        acc[method] = {
          count: 0,
          total: 0
        };
      }
      acc[method].count += 1;
      acc[method].total += transaction.amount;
      return acc;
    }, {});
  }
}

module.exports = new ReportingService();
