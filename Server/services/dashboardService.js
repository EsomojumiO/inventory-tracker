const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Employee = require('../models/Employee');
const reportingService = require('./reportingService');

class DashboardService {
  // Get all KPIs for the main dashboard
  async getDashboardKPIs(period = 'today') {
    const dates = this.getDateRange(period);
    const { startDate, endDate } = dates;

    const [
      financialSummary,
      topProducts,
      inventoryMetrics,
      salesPerformance,
      employeePerformance
    ] = await Promise.all([
      reportingService.getFinancialSummary(startDate, endDate),
      reportingService.getTopSellingProducts(startDate, endDate, 5),
      reportingService.getInventoryMetrics(),
      reportingService.getSalesPerformance(startDate, endDate, 'day'),
      reportingService.getEmployeePerformance(startDate, endDate)
    ]);

    return {
      period,
      dates,
      financialMetrics: {
        totalRevenue: financialSummary.income.total,
        totalExpenses: financialSummary.expenses.total,
        netProfit: financialSummary.netProfit,
        profitMargin: financialSummary.profitMargin
      },
      salesMetrics: {
        topProducts,
        salesTrend: salesPerformance,
        averageOrderValue: this.calculateAverageOrderValue(salesPerformance)
      },
      inventoryMetrics: {
        totalProducts: inventoryMetrics[0]?.totalProducts || 0,
        totalValue: inventoryMetrics[0]?.totalValue || 0,
        lowStock: inventoryMetrics[0]?.lowStock || 0,
        outOfStock: inventoryMetrics[0]?.outOfStock || 0
      },
      employeeMetrics: {
        topPerformers: employeePerformance.slice(0, 5),
        averageSalesPerEmployee: this.calculateAverageSalesPerEmployee(employeePerformance)
      }
    };
  }

  // Get customized KPIs based on user preferences
  async getCustomDashboard(preferences) {
    const { period, metrics } = preferences;
    const dates = this.getDateRange(period);
    const dashboard = {};

    for (const metric of metrics) {
      switch (metric) {
        case 'revenue':
          dashboard.revenue = await this.getRevenueMetrics(dates);
          break;
        case 'inventory':
          dashboard.inventory = await this.getInventoryMetrics(dates);
          break;
        case 'sales':
          dashboard.sales = await this.getSalesMetrics(dates);
          break;
        case 'employees':
          dashboard.employees = await this.getEmployeeMetrics(dates);
          break;
        case 'products':
          dashboard.products = await this.getProductMetrics(dates);
          break;
      }
    }

    return {
      period,
      dates,
      metrics: dashboard
    };
  }

  // Individual metric getters
  async getRevenueMetrics({ startDate, endDate }) {
    const summary = await reportingService.getFinancialSummary(startDate, endDate);
    return {
      total: summary.income.total,
      expenses: summary.expenses.total,
      profit: summary.netProfit,
      margin: summary.profitMargin,
      breakdown: summary.income.breakdown
    };
  }

  async getInventoryMetrics() {
    const [metrics, turnover] = await Promise.all([
      reportingService.getInventoryMetrics(),
      reportingService.getInventoryTurnover(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date())
    ]);

    return {
      current: metrics[0] || {},
      turnover
    };
  }

  async getSalesMetrics({ startDate, endDate }) {
    const [performance, topProducts] = await Promise.all([
      reportingService.getSalesPerformance(startDate, endDate, 'day'),
      reportingService.getTopSellingProducts(startDate, endDate, 10)
    ]);

    return {
      trend: performance,
      topProducts,
      averageOrderValue: this.calculateAverageOrderValue(performance)
    };
  }

  async getEmployeeMetrics({ startDate, endDate }) {
    const performance = await reportingService.getEmployeePerformance(startDate, endDate);
    return {
      performance,
      averageSales: this.calculateAverageSalesPerEmployee(performance),
      topPerformers: performance.slice(0, 5)
    };
  }

  async getProductMetrics({ startDate, endDate }) {
    const [topSelling, inventory] = await Promise.all([
      reportingService.getTopSellingProducts(startDate, endDate, 20),
      reportingService.getInventoryMetrics()
    ]);

    return {
      topSelling,
      inventory: inventory[0] || {},
      categories: await this.getProductCategories()
    };
  }

  // Helper methods
  getDateRange(period) {
    const now = new Date();
    const startDate = new Date();
    let endDate = new Date();

    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        startDate.setDate(now.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        endDate.setDate(now.getDate() - 1);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
    }

    return { startDate, endDate };
  }

  calculateAverageOrderValue(salesData) {
    if (!salesData || salesData.length === 0) return 0;
    
    const totalSales = salesData.reduce((sum, day) => sum + day.totalSales, 0);
    const totalOrders = salesData.reduce((sum, day) => sum + day.orderCount, 0);
    
    return totalOrders > 0 ? totalSales / totalOrders : 0;
  }

  calculateAverageSalesPerEmployee(employeeData) {
    if (!employeeData || employeeData.length === 0) return 0;
    
    const totalSales = employeeData.reduce((sum, emp) => sum + emp.totalSales, 0);
    return totalSales / employeeData.length;
  }

  async getProductCategories() {
    return Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$price', '$stockQuantity'] } }
        }
      },
      { $sort: { count: -1 } }
    ]);
  }

  // Save dashboard preferences
  async saveDashboardPreferences(userId, preferences) {
    // Implement saving user dashboard preferences to database
    // This could be stored in a user preferences collection
    return preferences;
  }

  // Load dashboard preferences
  async loadDashboardPreferences(userId) {
    // Implement loading user dashboard preferences from database
    // Return default preferences if none found
    return {
      period: 'today',
      metrics: ['revenue', 'inventory', 'sales', 'employees', 'products']
    };
  }
}

module.exports = new DashboardService();
