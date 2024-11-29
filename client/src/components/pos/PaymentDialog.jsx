import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Grid,
  Divider,
} from '@mui/material';
import { formatCurrency } from '../../utils/formatCurrency';

const PaymentDialog = ({
  open,
  onClose,
  total,
  paymentMethod,
  splitPayment,
  paymentAmounts,
  setPaymentMethod,
  setSplitPayment,
  setPaymentAmounts,
  onComplete
}) => {
  const [amountReceived, setAmountReceived] = useState('');
  const [change, setChange] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setAmountReceived('');
      setChange(0);
      setError('');
    }
  }, [open]);

  const handleAmountChange = (value, method) => {
    if (splitPayment) {
      const newAmounts = { ...paymentAmounts, [method]: Number(value) || 0 };
      setPaymentAmounts(newAmounts);
      
      const totalPaid = Object.values(newAmounts).reduce((sum, amount) => sum + amount, 0);
      setChange(totalPaid - total);
    } else {
      setAmountReceived(value);
      setChange(Number(value || 0) - total);
    }
  };

  const handlePayment = () => {
    if (splitPayment) {
      const totalPaid = Object.values(paymentAmounts).reduce((sum, amount) => sum + amount, 0);
      if (totalPaid < total) {
        setError('Total payment amount is less than the required total');
        return;
      }
    } else {
      if (Number(amountReceived) < total) {
        setError('Amount received is less than the total');
        return;
      }
    }

    onComplete({
      method: splitPayment ? 'split' : paymentMethod,
      amounts: splitPayment ? paymentAmounts : { [paymentMethod]: Number(amountReceived) },
      change: change
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Payment</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            Total: {formatCurrency(total)}
          </Typography>
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={splitPayment}
              onChange={(e) => setSplitPayment(e.target.checked)}
            />
          }
          label="Split Payment"
        />

        {splitPayment ? (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Cash Amount"
                type="number"
                value={paymentAmounts.cash || ''}
                onChange={(e) => handleAmountChange(e.target.value, 'cash')}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Card Amount"
                type="number"
                value={paymentAmounts.card || ''}
                onChange={(e) => handleAmountChange(e.target.value, 'card')}
              />
            </Grid>
          </Grid>
        ) : (
          <>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                label="Payment Method"
              >
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="card">Card</MenuItem>
                <MenuItem value="transfer">Bank Transfer</MenuItem>
              </Select>
            </FormControl>

            {paymentMethod === 'cash' && (
              <TextField
                fullWidth
                label="Amount Received"
                type="number"
                value={amountReceived}
                onChange={(e) => handleAmountChange(e.target.value)}
                sx={{ mt: 2 }}
              />
            )}
          </>
        )}

        <Divider sx={{ my: 2 }} />

        {change > 0 && (
          <Typography variant="h6" color="primary" gutterBottom>
            Change: {formatCurrency(change)}
          </Typography>
        )}

        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handlePayment}
          variant="contained"
          color="primary"
        >
          Complete Payment
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentDialog;
