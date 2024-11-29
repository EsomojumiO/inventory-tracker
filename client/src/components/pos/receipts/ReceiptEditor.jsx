import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  IconButton,
  Typography,
  Box,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useReceipt } from '../../../context/ReceiptContext';
import { useInventory } from '../../../context/InventoryContext';
import { useNotification } from '../../../hooks/useNotification';

const ReceiptEditor = ({ open, onClose, receipt }) => {
  const { createReceipt, updateReceipt, RECEIPT_STATUS, PAYMENT_METHODS, calculateTotals } = useReceipt();
  const { inventory } = useInventory();
  const { showError } = useNotification();

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    items: [],
    paymentMethod: PAYMENT_METHODS.CASH,
    status: RECEIPT_STATUS.PAID,
    notes: '',
  });

  useEffect(() => {
    if (receipt) {
      setFormData(receipt);
    }
  }, [receipt]);

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { id: '', name: '', sku: '', quantity: 1, price: 0 }]
    }));
  };

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          if (field === 'product') {
            // When selecting a product, update multiple fields
            return {
              ...item,
              id: value.id,
              name: value.name,
              sku: value.sku,
              price: value.price,
            };
          }
          return { ...item, [field]: value };
        }
        return item;
      })
    }));
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.customerName || formData.items.length === 0) {
        showError('Please fill in all required fields');
        return;
      }

      // Calculate totals
      const totals = calculateTotals(formData.items);
      const receiptData = {
        ...formData,
        ...totals,
      };

      if (receipt) {
        await updateReceipt(receipt.id, receiptData);
      } else {
        await createReceipt(receiptData);
      }

      onClose();
    } catch (error) {
      showError('Error saving receipt');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 3,
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {receipt ? 'Edit Receipt' : 'New Receipt'}
          </Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Customer Information */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Customer Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Customer Name"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customerName: e.target.value
                  }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Customer Email"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customerEmail: e.target.value
                  }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Customer Phone"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customerPhone: e.target.value
                  }))}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Items */}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle2">Items</Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddItem}
                size="small"
              >
                Add Item
              </Button>
            </Box>

            {formData.items.map((item, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <Autocomplete
                      options={inventory}
                      getOptionLabel={(option) => option.name}
                      value={inventory.find(p => p.id === item.id) || null}
                      onChange={(_, newValue) => handleItemChange(index, 'product', newValue)}
                      renderInput={(params) => (
                        <TextField {...params} label="Product" required />
                      )}
                    />
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <TextField
                      fullWidth
                      label="Quantity"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                      InputProps={{ inputProps: { min: 1 } }}
                    />
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <TextField
                      fullWidth
                      label="Price"
                      type="number"
                      value={item.price}
                      onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value))}
                      InputProps={{ inputProps: { min: 0 } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Typography variant="body1">
                      Total: {(item.quantity * item.price).toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={1}>
                    <IconButton
                      color="error"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Grid>

          {/* Payment Information */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Payment Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Payment Method"
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    paymentMethod: e.target.value
                  }))}
                >
                  {Object.entries(PAYMENT_METHODS).map(([key, value]) => (
                    <MenuItem key={key} value={value}>
                      {key.replace('_', ' ')}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  select
                  label="Status"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    status: e.target.value
                  }))}
                >
                  {Object.entries(RECEIPT_STATUS).map(([key, value]) => (
                    <MenuItem key={key} value={value}>
                      {key}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </Grid>

          {/* Notes */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                notes: e.target.value
              }))}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={formData.items.length === 0}
        >
          {receipt ? 'Update' : 'Create'} Receipt
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReceiptEditor;
