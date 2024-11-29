import React from 'react';
import CustomerManager from './CustomerManager';
import { Box } from '@mui/material';

const CustomersPage = () => {
  return (
    <Box p={3}>
      <CustomerManager />
    </Box>
  );
};

export default CustomersPage;