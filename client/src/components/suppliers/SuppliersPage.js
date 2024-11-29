import React from 'react';
import { Container, Typography, Paper } from '@mui/material';

const SuppliersPage = () => {
  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h4" gutterBottom>
          Supplier Management
        </Typography>
        {/* Add your supplier management content here */}
      </Paper>
    </Container>
  );
};

export default SuppliersPage;
