import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNotification } from '../hooks/useNotification';
import { useInventory } from './InventoryContext';
import { sales, getSalesByDateRange } from '../data/sampleData/salesData';
import { products, getLowStockProducts } from '../data/sampleData/productData';
import dayjs from 'dayjs';

const ReportContext = createContext();

const useReport = () => {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReport must be used within a ReportProvider');
  }
  return context;
};

// Enhanced scheduled reports data
const mockScheduledReports = [
  {
    id: 1,
    name: 'Daily Stock Level Report',
    type: 'stock-levels',
    frequency: 'daily',
    recipients: ['manager@retailmaster.com'],
    time: '08:00',
    lastRun: '2024-01-15T08:00:00',
    status: 'active',
  },
  {
    id: 2,
    name: 'Weekly Sales Analysis',
    type: 'sales-analysis',
    frequency: 'weekly',
    recipients: ['sales@retailmaster.com', 'manager@retailmaster.com'],
    time: '09:00',
    lastRun: '2024-01-14T09:00:00',
    status: 'active',
  },
  {
    id: 3,
    name: 'Monthly Inventory Valuation',
    type: 'inventory-valuation',
    frequency: 'monthly',
    recipients: ['finance@retailmaster.com', 'manager@retailmaster.com'],
    time: '07:00',
    lastRun: '2024-01-01T07:00:00',
    status: 'active',
  }
];

const ReportProvider = ({ children }) => {
  const [scheduledReports, setScheduledReports] = useState(mockScheduledReports);
  const { showSuccess, showError } = useNotification();
  const { inventory, categories } = useInventory();

  // Generate Stock Levels Report
  const generateStockLevelsReport = useCallback((filters = {}) => {
    try {
      const report = inventory.map(item => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        category: item.category,
        currentStock: item.quantity,
        reorderPoint: item.reorderPoint,
        status: item.quantity <= item.reorderPoint ? 'Low Stock' : 'Normal',
        value: item.quantity * item.price,
      }));

      // Apply filters
      let filteredReport = report;
      if (filters.category) {
        filteredReport = filteredReport.filter(item => item.category === filters.category);
      }
      if (filters.status) {
        filteredReport = filteredReport.filter(item => item.status === filters.status);
      }

      return filteredReport;
    } catch (error) {
      showError('Error generating stock levels report');
      throw error;
    }
  }, [inventory, showError]);

  // Generate Stock Movement Report
  const generateStockMovementReport = useCallback((dateRange) => {
    try {
      // Use actual sales data for movement analysis
      const movements = inventory.map(item => {
        const itemSales = sales.filter(sale => 
          sale.items.some(saleItem => saleItem.product === item.id)
        );
        
        const totalSold = itemSales.reduce((total, sale) => {
          const saleItem = sale.items.find(i => i.product === item.id);
          return total + (saleItem ? saleItem.quantity : 0);
        }, 0);

        return {
          id: item.id,
          name: item.name,
          sku: item.sku,
          category: item.category,
          opening: item.quantity + totalSold,
          received: 0, // This would come from purchase orders in a real system
          sold: totalSold,
          adjusted: 0,
          closing: item.quantity,
        };
      });

      return movements;
    } catch (error) {
      showError('Error generating stock movement report');
      throw error;
    }
  }, [inventory, showError]);

  // Generate Reorder Analysis Report
  const generateReorderAnalysisReport = useCallback(() => {
    try {
      const analysis = inventory
        .filter(item => item.quantity <= item.reorderPoint)
        .map(item => ({
          id: item.id,
          name: item.name,
          sku: item.sku,
          category: item.category,
          currentStock: item.quantity,
          reorderPoint: item.reorderPoint,
          suggestedOrder: Math.max(0, item.reorderPoint * 2 - item.quantity),
          supplier: item.supplier,
          lastOrderDate: null, // This would come from purchase order history
          averageDemand: null, // This would be calculated from sales history
        }));

      return analysis;
    } catch (error) {
      showError('Error generating reorder analysis report');
      throw error;
    }
  }, [inventory, showError]);

  // Enhanced inventory metrics for dashboard
  const getInventoryMetrics = useCallback(() => {
    if (!inventory || !categories) {
      return {
        totalItems: 0,
        lowStockItems: 0,
        totalValue: 0,
        itemsByCategory: [],
        recentSales: [],
        topSellingItems: []
      };
    }

    const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const lowStockItems = inventory.filter(item => item.quantity <= item.reorderPoint).length;
    const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    
    // Get recent sales from sample data
    const recentSales = sales
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    // Calculate top selling items
    const salesMap = sales.reduce((map, sale) => {
      sale.items.forEach(item => {
        map[item.product] = (map[item.product] || 0) + item.quantity;
      });
      return map;
    }, {});

    const topSellingItems = Object.entries(salesMap)
      .map(([productId, quantity]) => {
        const product = inventory.find(p => p.id === productId) || {};
        return {
          id: productId,
          name: product.name,
          quantity,
          value: quantity * (product.price || 0)
        };
      })
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Enhanced category analysis
    const itemsByCategory = Array.isArray(categories) ? categories.map(category => {
      const categoryItems = inventory.filter(item => item.category === category);
      return {
        name: category,
        count: categoryItems.length,
        value: categoryItems.reduce((sum, item) => sum + (item.quantity * item.price), 0),
        lowStock: categoryItems.filter(item => item.quantity <= item.reorderPoint).length
      };
    }) : [];

    return {
      totalItems,
      lowStockItems,
      totalValue,
      itemsByCategory,
      recentSales,
      topSellingItems
    };
  }, [inventory, categories]);

  const value = {
    scheduledReports,
    generateStockLevelsReport,
    generateStockMovementReport,
    generateReorderAnalysisReport,
    getInventoryMetrics,
  };

  return (
    <ReportContext.Provider value={value}>
      {children}
    </ReportContext.Provider>
  );
};

export { ReportProvider, useReport };
