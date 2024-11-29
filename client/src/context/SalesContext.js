import React, { createContext, useContext, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

const SalesContext = createContext();

export const SalesProvider = ({ children }) => {
  const [sales, setSales] = useState([]);

  const addSale = (saleData) => {
    const newSale = {
      id: uuidv4(),
      ...saleData,
      timestamp: new Date().toISOString(),
    };
    setSales(prevSales => [...prevSales, newSale]);
    return newSale;
  };

  const getSalesByDateRange = (startDate, endDate) => {
    return sales.filter(sale => {
      const saleDate = dayjs(sale.date);
      return saleDate.isAfter(startDate) && saleDate.isBefore(endDate);
    });
  };

  const getTotalRevenue = (salesList = sales) => {
    return salesList.reduce((total, sale) => total + (sale.quantity * sale.salePrice), 0);
  };

  const getSalesByItem = (itemId) => {
    return sales.filter(sale => sale.itemId === itemId);
  };

  const getSalesByCustomer = (customerName) => {
    return sales.filter(sale => 
      sale.customerName && 
      sale.customerName.toLowerCase().includes(customerName.toLowerCase())
    );
  };

  const value = {
    sales,
    addSale,
    getSalesByDateRange,
    getTotalRevenue,
    getSalesByItem,
    getSalesByCustomer,
  };

  return (
    <SalesContext.Provider value={value}>
      {children}
    </SalesContext.Provider>
  );
};

export const useSales = () => {
  const context = useContext(SalesContext);
  if (!context) {
    throw new Error('useSales must be used within a SalesProvider');
  }
  return context;
};

export default SalesContext;
