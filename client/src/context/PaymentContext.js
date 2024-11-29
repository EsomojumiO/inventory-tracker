import React, { createContext, useContext, useState } from 'react';
import { usePaymentProcessor } from '../hooks/usePaymentProcessor';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { usePrinter } from '../hooks/usePrinter';

const PaymentContext = createContext();

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};

export const PaymentProvider = ({ children }) => {
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const paymentProcessor = usePaymentProcessor();
  const offlineSync = useOfflineSync();
  const printer = usePrinter();

  const processPayment = async (paymentData) => {
    try {
      setCurrentTransaction(paymentData);
      
      // Check if we're online
      if (!paymentProcessor.isOnline) {
        // Queue for offline processing
        const result = await offlineSync.queueOfflinePayment(paymentData);
        return result;
      }

      // Process payment online
      const result = await paymentProcessor.processPayment(paymentData);
      
      // Generate and print receipt
      if (result.success) {
        if (paymentData.printReceipt) {
          await printer.printReceipt(result.receiptUrl);
        }
        
        if (paymentData.emailReceipt && paymentData.customer?.email) {
          // Send email receipt (implement this in your backend)
          await fetch('/api/receipts/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              transactionId: result.transactionId,
              email: paymentData.customer.email,
            }),
          });
        }
      }

      return result;
    } catch (error) {
      console.error('Payment processing error:', error);
      throw error;
    } finally {
      setCurrentTransaction(null);
    }
  };

  const value = {
    currentTransaction,
    processPayment,
    isOnline: paymentProcessor.isOnline,
    processingPayment: paymentProcessor.processingPayment,
    pendingTransactions: offlineSync.pendingTransactions,
    syncStatus: offlineSync.syncStatus,
    syncTransactions: offlineSync.syncTransactions,
    retryTransaction: offlineSync.retryTransaction,
    printReceipt: printer.printReceipt,
    printToThermalPrinter: printer.printToThermalPrinter,
    generateQRCode: printer.generateQRCode,
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};
