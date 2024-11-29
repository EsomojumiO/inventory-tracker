import React from 'react';
import { Container, Typography, Paper } from '@mui/material';

const POSPage = () => {
  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h4" gutterBottom>
          Point of Sale
        </Typography>
        {/* Add your POS content here */}
      </Paper>
    </Container>
  );
};

export default POSPage;
