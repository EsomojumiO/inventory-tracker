import React from 'react';
import { Container, Typography, Paper } from '@mui/material';

const StockPage = () => {
  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h4" gutterBottom>
          Stock Management
        </Typography>
        {/* Add your stock management content here */}
      </Paper>
    </Container>
  );
};

export default StockPage;
