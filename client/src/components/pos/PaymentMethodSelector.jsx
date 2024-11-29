import React from 'react';
import {
  Box,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  TextField,
  Grid,
  Typography,
  Chip,
} from '@mui/material';
import {
  Payment as PaymentIcon,
  Money as MoneyIcon,
  CreditCard as CreditCardIcon,
  PhonelinkRing as MobileIcon,
  AccountBalance as BankIcon,
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/formatCurrency';

const paymentMethods = [
  { id: 'cash', label: 'Cash', icon: <MoneyIcon /> },
  { id: 'card', label: 'Card', icon: <CreditCardIcon /> },
  { id: 'momo', label: 'Mobile Money', icon: <MobileIcon /> },
  { id: 'transfer', label: 'Bank Transfer', icon: <BankIcon /> },
];

const PaymentMethodSelector = ({
  selectedMethod,
  onMethodChange,
  splitPayment,
  onSplitPaymentChange,
  paymentAmounts,
  onPaymentAmountsChange,
  total,
}) => {
  const handleAmountChange = (method, value) => {
    const numValue = parseFloat(value) || 0;
    const newAmounts = { ...paymentAmounts, [method]: numValue };
    onPaymentAmountsChange(newAmounts);
  };

  const remainingAmount = total - Object.values(paymentAmounts).reduce((sum, amount) => sum + amount, 0);

  return (
    <Box>
      <FormControlLabel
        control={
          <Switch
            checked={splitPayment}
            onChange={(e) => {
              onSplitPaymentChange(e.target.checked);
              if (!e.target.checked) {
                onPaymentAmountsChange({});
              }
            }}
          />
        }
        label="Split Payment"
        sx={{ mb: 2 }}
      />

      {splitPayment ? (
        <Grid container spacing={2}>
          {paymentMethods.map((method) => (
            <Grid item xs={12} sm={6} key={method.id}>
              <TextField
                fullWidth
                label={`${method.label} Amount`}
                type="number"
                InputProps={{
                  startAdornment: method.icon,
                }}
                value={paymentAmounts[method.id] || ''}
                onChange={(e) => handleAmountChange(method.id, e.target.value)}
                helperText={`${method.label} payment amount`}
              />
            </Grid>
          ))}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography color="textSecondary">
                Remaining: {formatCurrency(remainingAmount)}
              </Typography>
              <Chip
                label={`Total: ${formatCurrency(total)}`}
                color={remainingAmount === 0 ? 'success' : 'warning'}
              />
            </Box>
          </Grid>
        </Grid>
      ) : (
        <FormControl fullWidth>
          <InputLabel>Payment Method</InputLabel>
          <Select
            value={selectedMethod}
            onChange={(e) => onMethodChange(e.target.value)}
            startAdornment={
              paymentMethods.find(m => m.id === selectedMethod)?.icon
            }
          >
            {paymentMethods.map((method) => (
              <MenuItem value={method.id} key={method.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {method.icon}
                  {method.label}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </Box>
  );
};

export default PaymentMethodSelector;
