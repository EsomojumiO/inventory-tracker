import { useState } from 'react';

export const usePrinter = () => {
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState(null);

  const printReceipt = async (receiptUrl) => {
    try {
      setPrinting(true);
      setError(null);

      // Fetch receipt HTML content
      const response = await fetch(receiptUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch receipt content');
      }

      const receiptHtml = await response.text();

      // Create a temporary iframe for printing
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      // Write receipt content to iframe
      iframe.contentDocument.write(receiptHtml);
      iframe.contentDocument.close();

      // Wait for images to load
      await new Promise((resolve) => {
        iframe.onload = resolve;
      });

      // Print the iframe content
      iframe.contentWindow.print();

      // Cleanup
      document.body.removeChild(iframe);

      return true;
    } catch (err) {
      setError(err.message);
      console.error('Printing error:', err);
      throw err;
    } finally {
      setPrinting(false);
    }
  };

  const printToThermalPrinter = async (receiptData) => {
    try {
      setPrinting(true);
      setError(null);

      // Format receipt data for thermal printer
      const formattedData = formatForThermalPrinter(receiptData);

      // Send to thermal printer service
      const response = await fetch('/api/print/thermal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedData),
      });

      if (!response.ok) {
        throw new Error('Failed to print to thermal printer');
      }

      return true;
    } catch (err) {
      setError(err.message);
      console.error('Thermal printing error:', err);
      throw err;
    } finally {
      setPrinting(false);
    }
  };

  const formatForThermalPrinter = (data) => {
    // Format receipt data for thermal printer
    // This will depend on your specific thermal printer requirements
    return {
      businessInfo: {
        name: data.businessInfo.name,
        address: data.businessInfo.address,
        phone: data.businessInfo.phone,
      },
      transactionInfo: {
        id: data.transactionId,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
      },
      items: data.cart.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        total: item.quantity * item.price,
      })),
      totals: {
        subtotal: data.subtotal,
        tax: data.tax,
        total: data.total,
      },
      paymentInfo: {
        method: data.method,
        amounts: data.amounts,
      },
      customerInfo: data.customer,
      footer: {
        thankYouMessage: 'Thank you for your business!',
        returnPolicy: 'Returns accepted within 7 days with receipt',
      },
    };
  };

  const generateQRCode = async (receiptData) => {
    try {
      const response = await fetch('/api/receipts/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(receiptData),
      });

      if (!response.ok) {
        throw new Error('Failed to generate QR code');
      }

      const { qrCodeUrl } = await response.json();
      return qrCodeUrl;
    } catch (err) {
      console.error('QR code generation error:', err);
      throw err;
    }
  };

  return {
    printReceipt,
    printToThermalPrinter,
    generateQRCode,
    printing,
    error,
  };
};
