import React from 'react';
import { Box, Container } from '@mui/material';
import CustomerManager from './CustomerManager';

const CustomersPage = () => {
  return (
    <Box py={3}>
      <Container maxWidth="xl">
        <CustomerManager />
      </Container>
    </Box>
  );
};

export default CustomersPage;