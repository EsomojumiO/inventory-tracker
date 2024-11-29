import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip
} from '@mui/material';

const StockHistoryDialog = ({ open, onClose, product }) => {
  if (!product) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-NG', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Stock History - {product.name}</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="textSecondary">
            SKU: {product.sku}
          </Typography>
        </Box>

        {product.stockHistory && product.stockHistory.length > 0 ? (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {product.stockHistory
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((record, index) => (
                    <TableRow key={index}>
                      <TableCell>{formatDate(record.date)}</TableCell>
                      <TableCell>
                        <Chip
                          label={record.type === 'add' ? 'Stock Added' : 'Stock Removed'}
                          color={record.type === 'add' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        {record.type === 'add' ? '+' : '-'}{Math.abs(record.quantity)}
                      </TableCell>
                      <TableCell>{record.notes}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography color="textSecondary" align="center" sx={{ py: 3 }}>
            No stock history available
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default StockHistoryDialog;
