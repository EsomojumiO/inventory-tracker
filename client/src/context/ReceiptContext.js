import React, { createContext, useContext, useState, useCallback } from 'react';
import { useNotification } from '../hooks/useNotification';
import { useInventory } from './InventoryContext';

const ReceiptContext = createContext();

// Sample receipt status options
export const RECEIPT_STATUS = {
  PAID: 'paid',
  PENDING: 'pending',
  VOID: 'void'
};

// Sample payment methods
export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  TRANSFER: 'transfer',
  MOBILE_MONEY: 'mobile_money'
};

export const ReceiptProvider = ({ children }) => {
  const [receipts, setReceipts] = useState([]);
  const [documents, setDocuments] = useState([]);
  const { showSuccess, showError } = useNotification();
  const { inventory, formatCurrency } = useInventory();

  // Generate unique receipt number
  const generateReceiptNumber = useCallback(() => {
    const prefix = 'RCP';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  }, []);

  // Create new receipt
  const createReceipt = useCallback((receiptData) => {
    try {
      const newReceipt = {
        ...receiptData,
        id: receipts.length + 1,
        receiptNumber: generateReceiptNumber(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setReceipts(prev => [...prev, newReceipt]);
      showSuccess('Receipt created successfully');
      return newReceipt;
    } catch (error) {
      showError('Error creating receipt');
      throw error;
    }
  }, [receipts, generateReceiptNumber, showSuccess, showError]);

  // Update receipt
  const updateReceipt = useCallback((receiptId, updates) => {
    try {
      setReceipts(prev => prev.map(receipt =>
        receipt.id === receiptId
          ? { ...receipt, ...updates, updatedAt: new Date().toISOString() }
          : receipt
      ));
      showSuccess('Receipt updated successfully');
    } catch (error) {
      showError('Error updating receipt');
      throw error;
    }
  }, [showSuccess, showError]);

  // Delete receipt
  const deleteReceipt = useCallback((receiptId) => {
    try {
      setReceipts(prev => prev.filter(receipt => receipt.id !== receiptId));
      showSuccess('Receipt deleted successfully');
    } catch (error) {
      showError('Error deleting receipt');
      throw error;
    }
  }, [showSuccess, showError]);

  // Generate document (quotation, invoice, etc.)
  const generateDocument = useCallback((documentData) => {
    try {
      const newDocument = {
        ...documentData,
        id: documents.length + 1,
        documentNumber: `DOC${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setDocuments(prev => [...prev, newDocument]);
      showSuccess('Document generated successfully');
      return newDocument;
    } catch (error) {
      showError('Error generating document');
      throw error;
    }
  }, [documents, showSuccess, showError]);

  // Calculate totals for receipt
  const calculateTotals = useCallback((items) => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.075; // 7.5% VAT
    const total = subtotal + tax;
    
    return {
      subtotal,
      tax,
      total,
      formattedSubtotal: formatCurrency(subtotal),
      formattedTax: formatCurrency(tax),
      formattedTotal: formatCurrency(total)
    };
  }, [formatCurrency]);

  // Search receipts
  const searchReceipts = useCallback((filters = {}) => {
    let filteredReceipts = [...receipts];

    if (filters.dateRange) {
      const { startDate, endDate } = filters.dateRange;
      filteredReceipts = filteredReceipts.filter(receipt => {
        const receiptDate = new Date(receipt.createdAt);
        return receiptDate >= startDate && receiptDate <= endDate;
      });
    }

    if (filters.status) {
      filteredReceipts = filteredReceipts.filter(receipt => 
        receipt.status === filters.status
      );
    }

    if (filters.customerName) {
      filteredReceipts = filteredReceipts.filter(receipt =>
        receipt.customerName.toLowerCase().includes(filters.customerName.toLowerCase())
      );
    }

    return filteredReceipts;
  }, [receipts]);

  const value = {
    receipts,
    documents,
    createReceipt,
    updateReceipt,
    deleteReceipt,
    generateDocument,
    calculateTotals,
    searchReceipts,
    RECEIPT_STATUS,
    PAYMENT_METHODS
  };

  return (
    <ReceiptContext.Provider value={value}>
      {children}
    </ReceiptContext.Provider>
  );
};

export const useReceipt = () => {
  const context = useContext(ReceiptContext);
  if (!context) {
    throw new Error('useReceipt must be used within a ReceiptProvider');
  }
  return context;
};

export default ReceiptContext;
