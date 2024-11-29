import React from 'react';
import {
  Box,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  Chip,
} from '@mui/material';
import { formatCurrency } from '../../utils/formatCurrency';

const PaymentSummary = ({
  cart,
  tax,
  total,
  paymentMethod,
  splitPayment,
  paymentAmounts,
}) => {
  const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Payment Summary
      </Typography>

      <List disablePadding>
        {cart.items.map((item) => (
          <ListItem key={item.id} sx={{ py: 1, px: 0 }}>
            <ListItemText
              primary={item.name}
              secondary={`${item.quantity} x ${formatCurrency(item.price)}`}
            />
            <Typography variant="body2">
              {formatCurrency(item.price * item.quantity)}
            </Typography>
          </ListItem>
        ))}

        <Divider sx={{ my: 2 }} />

        <ListItem sx={{ py: 1, px: 0 }}>
          <ListItemText primary="Subtotal" />
          <Typography variant="subtitle1">
            {formatCurrency(subtotal)}
          </Typography>
        </ListItem>

        <ListItem sx={{ py: 1, px: 0 }}>
          <ListItemText primary="VAT (7.5%)" />
          <Typography variant="subtitle1">
            {formatCurrency(tax)}
          </Typography>
        </ListItem>

        <ListItem sx={{ py: 1, px: 0 }}>
          <ListItemText primary="Total" />
          <Typography variant="h6" color="primary">
            {formatCurrency(total)}
          </Typography>
        </ListItem>

        {splitPayment && Object.keys(paymentAmounts).length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
              Payment Breakdown
            </Typography>
            {Object.entries(paymentAmounts).map(([method, amount]) => {
              if (amount > 0) {
                return (
                  <ListItem key={method} sx={{ py: 0.5, px: 0 }}>
                    <ListItemText
                      primary={method.charAt(0).toUpperCase() + method.slice(1)}
                    />
                    <Typography variant="body2">
                      {formatCurrency(amount)}
                    </Typography>
                  </ListItem>
                );
              }
              return null;
            })}
          </>
        )}

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Chip
            label={splitPayment ? 'Split Payment' : paymentMethod.toUpperCase()}
            color="primary"
            variant="outlined"
          />
        </Box>
      </List>
    </Box>
  );
};

export default PaymentSummary;
