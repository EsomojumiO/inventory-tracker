import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Box
} from '@mui/material';
import { formatCurrency } from '../../utils/formatters';

const StockAdjustmentDialog = ({ open, onClose, onSubmit, product }) => {
  const [adjustmentData, setAdjustmentData] = useState({
    type: 'add',
    quantity: '',
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAdjustmentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = () => {
    const quantity = parseInt(adjustmentData.quantity) * (adjustmentData.type === 'remove' ? -1 : 1);
    onSubmit({
      ...adjustmentData,
      quantity
    });
    setAdjustmentData({
      type: 'add',
      quantity: '',
      notes: ''
    });
  };

  if (!product) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Adjust Stock - {product.name}</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3, mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">
                Current Stock
              </Typography>
              <Typography variant="h6">
                {product.quantity}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">
                Unit Price
              </Typography>
              <Typography variant="h6">
                {formatCurrency(product.price)}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Adjustment Type</InputLabel>
              <Select
                name="type"
                value={adjustmentData.type}
                onChange={handleChange}
                label="Adjustment Type"
              >
                <MenuItem value="add">Add Stock</MenuItem>
                <MenuItem value="remove">Remove Stock</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Quantity"
              type="number"
              name="quantity"
              value={adjustmentData.quantity}
              onChange={handleChange}
              inputProps={{ min: 1 }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notes"
              name="notes"
              value={adjustmentData.notes}
              onChange={handleChange}
              multiline
              rows={3}
              placeholder="Enter reason for adjustment"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!adjustmentData.quantity || !adjustmentData.notes}
        >
          Confirm Adjustment
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StockAdjustmentDialog;
