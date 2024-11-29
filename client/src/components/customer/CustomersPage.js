import React from 'react';
import { Box, Container } from '@mui/material';
import CustomerManager from './CustomerManager';
import { CustomerProvider } from '../../context/CustomerContext';

const CustomersPage = () => {
  return (
    <CustomerProvider>
      <Box py={3}>
        <Container maxWidth="xl">
          <CustomerManager />
        </Container>
      </Box>
    </CustomerProvider>
  );
};

export default CustomersPage;