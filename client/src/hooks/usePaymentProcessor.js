import { useState, useEffect } from 'react';

export const usePaymentProcessor = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const processPayment = async (paymentData) => {
    try {
      setProcessingPayment(true);
      setError(null);

      // Validate payment data
      if (!paymentData.method) {
        throw new Error('Payment method is required');
      }

      if (paymentData.method === 'split' && !Object.values(paymentData.amounts).length) {
        throw new Error('Split payment amounts are required');
      }

      // Process different payment methods
      let result;
      switch (paymentData.method) {
        case 'cash':
          result = await processCashPayment(paymentData);
          break;
        case 'card':
          result = await processCardPayment(paymentData);
          break;
        case 'momo':
          result = await processMobileMoneyPayment(paymentData);
          break;
        case 'transfer':
          result = await processBankTransfer(paymentData);
          break;
        case 'split':
          result = await processSplitPayment(paymentData);
          break;
        default:
          throw new Error('Unsupported payment method');
      }

      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setProcessingPayment(false);
    }
  };

  const processCashPayment = async (data) => {
    // Simulate cash payment processing
    const response = await fetch('/api/payments/cash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to process cash payment');
    }

    return await response.json();
  };

  const processCardPayment = async (data) => {
    // Integrate with payment gateway (e.g., Paystack, Flutterwave)
    const response = await fetch('/api/payments/card', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to process card payment');
    }

    return await response.json();
  };

  const processMobileMoneyPayment = async (data) => {
    // Process mobile money payment
    const response = await fetch('/api/payments/momo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to process mobile money payment');
    }

    return await response.json();
  };

  const processBankTransfer = async (data) => {
    // Process bank transfer
    const response = await fetch('/api/payments/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to process bank transfer');
    }

    return await response.json();
  };

  const processSplitPayment = async (data) => {
    // Process split payment
    const response = await fetch('/api/payments/split', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to process split payment');
    }

    return await response.json();
  };

  return {
    processPayment,
    isOnline,
    processingPayment,
    error,
  };
};
