import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Divider,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Email as EmailIcon,
  QrCode as QrCodeIcon,
  Save as SaveIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/formatCurrency';
import PaymentMethodSelector from './PaymentMethodSelector';
import ReceiptPreview from './ReceiptPreview';
import PaymentSummary from './PaymentSummary';
import CustomerForm from './CustomerForm';
import { usePaymentProcessor } from '../../hooks/usePaymentProcessor';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { usePrinter } from '../../hooks/usePrinter';

const PaymentsPage = ({ cart, onPaymentComplete, onCancel }) => {
  const [selectedMethod, setSelectedMethod] = useState('cash');
  const [splitPayment, setSplitPayment] = useState(false);
  const [paymentAmounts, setPaymentAmounts] = useState({});
  const [customerInfo, setCustomerInfo] = useState({});
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [receiptUrl, setReceiptUrl] = useState(null);

  const { processPayment, isOnline } = usePaymentProcessor();
  const { queueOfflinePayment } = useOfflineSync();
  const { printReceipt } = usePrinter();

  const total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = total * 0.075; // 7.5% VAT
  const grandTotal = total + tax;

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      const paymentData = {
        method: splitPayment ? 'split' : selectedMethod,
        amounts: splitPayment ? paymentAmounts : { [selectedMethod]: grandTotal },
        cart: cart,
        customer: customerInfo,
        notes,
        tax,
        total: grandTotal,
        timestamp: new Date().toISOString(),
      };

      if (!isOnline && selectedMethod !== 'cash') {
        throw new Error('Online payment methods are not available in offline mode');
      }

      let result;
      if (isOnline) {
        result = await processPayment(paymentData);
      } else {
        result = await queueOfflinePayment(paymentData);
      }

      // Generate receipt
      const receiptData = {
        ...paymentData,
        transactionId: result.transactionId,
        businessInfo: {
          name: 'Your Business Name',
          address: 'Your Business Address',
          phone: 'Your Business Phone',
          email: 'your@email.com',
        },
      };

      const receiptUrl = await generateReceipt(receiptData);
      setReceiptUrl(receiptUrl);

      onPaymentComplete(result);
    } catch (err) {
      setError(err.message);
      console.error('Payment error:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateReceipt = async (data) => {
    // Implementation for receipt generation
    // This would typically call your backend API
    return '/api/receipts/generate';
  };

  const handleEmailReceipt = async () => {
    if (customerInfo.email) {
      try {
        await fetch('/api/receipts/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: customerInfo.email,
            receiptUrl,
          }),
        });
      } catch (error) {
        console.error('Error emailing receipt:', error);
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Left Column - Payment Methods & Customer Info */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Payment Method
            </Typography>
            <PaymentMethodSelector
              selectedMethod={selectedMethod}
              onMethodChange={setSelectedMethod}
              splitPayment={splitPayment}
              onSplitPaymentChange={setSplitPayment}
              paymentAmounts={paymentAmounts}
              onPaymentAmountsChange={setPaymentAmounts}
              total={grandTotal}
            />
          </Paper>

          <Paper sx={{ p: 2 }}>
            <CustomerForm
              customerInfo={customerInfo}
              onCustomerInfoChange={setCustomerInfo}
              notes={notes}
              onNotesChange={setNotes}
            />
          </Paper>
        </Grid>

        {/* Right Column - Summary & Actions */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <PaymentSummary
              cart={cart}
              tax={tax}
              total={grandTotal}
              paymentMethod={selectedMethod}
              splitPayment={splitPayment}
              paymentAmounts={paymentAmounts}
            />
          </Paper>

          <Paper sx={{ p: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handlePayment}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
              >
                Complete Payment
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            </Box>

            {receiptUrl && (
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                <IconButton onClick={() => printReceipt(receiptUrl)}>
                  <PrintIcon />
                </IconButton>
                <IconButton onClick={handleEmailReceipt}>
                  <EmailIcon />
                </IconButton>
                <IconButton>
                  <QrCodeIcon />
                </IconButton>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PaymentsPage;
