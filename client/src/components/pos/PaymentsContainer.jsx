import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Container,
} from '@mui/material';
import { ShoppingCart as CartIcon } from '@mui/icons-material';
import PaymentsPage from './PaymentsPage';
import { useSales } from '../../context/SalesContext';

const PaymentsContainer = () => {
  const navigate = useNavigate();
  const { currentCart } = useSales();

  const handlePaymentComplete = (result) => {
    // Handle successful payment
    console.log('Payment completed:', result);
    navigate('/pos/sales-terminal');
  };

  const handleCancel = () => {
    navigate('/pos/sales-terminal');
  };

  // If no items in cart, show empty state
  if (!currentCart?.items?.length) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CartIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            No Items in Cart
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Please add items to your cart in the Sales Terminal before proceeding to payment.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/pos/sales-terminal')}
          >
            Go to Sales Terminal
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <PaymentsPage
      cart={currentCart}
      onPaymentComplete={handlePaymentComplete}
      onCancel={handleCancel}
    />
  );
};

export default PaymentsContainer;
