import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNotification } from '../hooks/useNotification';

const SupplierContext = createContext();

// Mock data for development
const mockSuppliers = [
  {
    id: 1,
    name: 'Tech Solutions Inc.',
    contactPerson: 'John Smith',
    email: 'john@techsolutions.com',
    phone: '+1-555-0123',
    address: '123 Tech Street, Silicon Valley, CA',
    categories: ['Electronics', 'Accessories'],
    rating: 4.5,
    status: 'active',
    paymentTerms: 'Net 30',
    deliveryTime: '3-5 days',
    notes: 'Preferred supplier for electronic components',
    performance: {
      onTimeDelivery: 95,
      qualityScore: 4.8,
      responseTime: 24, // hours
    },
  },
  {
    id: 2,
    name: 'Global Imports Ltd.',
    contactPerson: 'Sarah Johnson',
    email: 'sarah@globalimports.com',
    phone: '+1-555-0124',
    address: '456 Import Avenue, New York, NY',
    categories: ['General Merchandise', 'Office Supplies'],
    rating: 4.0,
    status: 'active',
    paymentTerms: 'Net 45',
    deliveryTime: '5-7 days',
    notes: 'Bulk order specialist',
    performance: {
      onTimeDelivery: 88,
      qualityScore: 4.2,
      responseTime: 48,
    },
  },
];

export const SupplierProvider = ({ children }) => {
  const [suppliers, setSuppliers] = useState(mockSuppliers);
  const { showSuccess, showError } = useNotification();

  const addSupplier = useCallback(async (supplierData) => {
    try {
      // TODO: Replace with actual API call
      const newSupplier = {
        ...supplierData,
        id: suppliers.length + 1,
        performance: {
          onTimeDelivery: 100,
          qualityScore: 5.0,
          responseTime: 24,
        },
      };
      setSuppliers((prev) => [...prev, newSupplier]);
      showSuccess('Supplier added successfully');
      return newSupplier;
    } catch (error) {
      showError('Failed to add supplier');
      throw error;
    }
  }, [suppliers, showSuccess, showError]);

  const updateSupplier = useCallback(async (id, supplierData) => {
    try {
      // TODO: Replace with actual API call
      setSuppliers((prev) =>
        prev.map((supplier) =>
          supplier.id === id ? { ...supplier, ...supplierData } : supplier
        )
      );
      showSuccess('Supplier updated successfully');
    } catch (error) {
      showError('Failed to update supplier');
      throw error;
    }
  }, [showSuccess, showError]);

  const deleteSupplier = useCallback(async (id) => {
    try {
      // TODO: Replace with actual API call
      setSuppliers((prev) => prev.filter((supplier) => supplier.id !== id));
      showSuccess('Supplier deleted successfully');
    } catch (error) {
      showError('Failed to delete supplier');
      throw error;
    }
  }, [showSuccess, showError]);

  const getSupplierById = useCallback((id) => {
    return suppliers.find((supplier) => supplier.id === id);
  }, [suppliers]);

  const getSupplierMetrics = useCallback(() => {
    const totalSuppliers = suppliers.length;
    const activeSuppliers = suppliers.filter((s) => s.status === 'active').length;
    const averageRating = suppliers.reduce((acc, curr) => acc + curr.rating, 0) / totalSuppliers;
    const averageDeliveryTime = suppliers.reduce((acc, curr) => acc + curr.performance.onTimeDelivery, 0) / totalSuppliers;

    return {
      totalSuppliers,
      activeSuppliers,
      inactiveSuppliers: totalSuppliers - activeSuppliers,
      averageRating,
      averageDeliveryTime,
    };
  }, [suppliers]);

  const value = {
    suppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    getSupplierById,
    getSupplierMetrics,
  };

  return (
    <SupplierContext.Provider value={value}>
      {children}
    </SupplierContext.Provider>
  );
};

export const useSupplier = () => {
  const context = useContext(SupplierContext);
  if (!context) {
    throw new Error('useSupplier must be used within a SupplierProvider');
  }
  return context;
};

export default SupplierContext;
