import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from '@mui/material';
import { formatCurrency } from '../../utils/formatCurrency';

const ReceiptPreview = ({
  businessInfo,
  transactionId,
  items,
  subtotal,
  tax,
  total,
  paymentMethod,
  paymentAmounts,
  customerInfo,
  date = new Date(),
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        minWidth: 300,
        maxWidth: 400,
        mx: 'auto',
        backgroundColor: '#fff',
        color: '#000',
      }}
    >
      {/* Business Information */}
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          {businessInfo.name}
        </Typography>
        <Typography variant="body2">{businessInfo.address}</Typography>
        <Typography variant="body2">{businessInfo.phone}</Typography>
        <Typography variant="body2">VAT Reg: {businessInfo.vatNumber}</Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Transaction Details */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2">
          Transaction ID: {transactionId}
        </Typography>
        <Typography variant="body2">
          Date: {date.toLocaleDateString()}
        </Typography>
        <Typography variant="body2">
          Time: {date.toLocaleTimeString()}
        </Typography>
      </Box>

      {/* Items Table */}
      <TableContainer component={Box}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="right">Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.name}</TableCell>
                <TableCell align="right">{item.quantity}</TableCell>
                <TableCell align="right">{formatCurrency(item.price)}</TableCell>
                <TableCell align="right">
                  {formatCurrency(item.price * item.quantity)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Totals */}
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Subtotal:</span>
          <span>{formatCurrency(subtotal)}</span>
        </Typography>
        <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>VAT (7.5%):</span>
          <span>{formatCurrency(tax)}</span>
        </Typography>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            fontWeight: 'bold',
            mt: 1
          }}
        >
          <span>Total:</span>
          <span>{formatCurrency(total)}</span>
        </Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Payment Information */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
          Payment Details
        </Typography>
        {paymentMethod === 'split' ? (
          Object.entries(paymentAmounts).map(([method, amount]) => (
            amount > 0 && (
              <Typography 
                key={method} 
                variant="body2" 
                sx={{ display: 'flex', justifyContent: 'space-between' }}
              >
                <span>{method.toUpperCase()}:</span>
                <span>{formatCurrency(amount)}</span>
              </Typography>
            )
          ))
        ) : (
          <Typography variant="body2">
            Method: {paymentMethod.toUpperCase()}
          </Typography>
        )}
      </Box>

      {/* Customer Information */}
      {customerInfo && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            Customer Information
          </Typography>
          {customerInfo.name && (
            <Typography variant="body2">Name: {customerInfo.name}</Typography>
          )}
          {customerInfo.phone && (
            <Typography variant="body2">Phone: {customerInfo.phone}</Typography>
          )}
          {customerInfo.email && (
            <Typography variant="body2">Email: {customerInfo.email}</Typography>
          )}
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Footer */}
      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
          Thank you for your business!
        </Typography>
        <Typography variant="body2">
          Returns accepted within 7 days with receipt
        </Typography>
      </Box>
    </Paper>
  );
};

export default ReceiptPreview;
