import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  Autocomplete,
  InputAdornment,
  Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { useInventory } from '../../context/InventoryContext';
import { useNotification } from '../../context/NotificationContext';

function SalesForm({ onSubmit }) {
  const { inventory } = useInventory();
  const { showError } = useNotification();
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    quantity: '',
    salePrice: '',
    date: dayjs(),
    customerName: '',
    customerContact: '',
  });

  useEffect(() => {
    if (selectedItem) {
      setFormData(prev => ({
        ...prev,
        salePrice: selectedItem.price.toString()
      }));
    }
  }, [selectedItem]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedItem) {
      showError('Please select an item');
      return;
    }

    if (!formData.quantity || formData.quantity <= 0) {
      showError('Please enter a valid quantity');
      return;
    }

    if (!formData.salePrice || formData.salePrice <= 0) {
      showError('Please enter a valid sale price');
      return;
    }

    onSubmit({
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      quantity: parseInt(formData.quantity, 10),
      salePrice: parseFloat(formData.salePrice),
      date: formData.date.toISOString(),
      customerName: formData.customerName,
      customerContact: formData.customerContact,
    });

    // Reset form
    setSelectedItem(null);
    setFormData({
      quantity: '',
      salePrice: '',
      date: dayjs(),
      customerName: '',
      customerContact: '',
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Record New Sale
          </Typography>
        </Grid>

        <Grid item xs={12} md={6}>
          <Autocomplete
            options={inventory}
            getOptionLabel={(option) => `${option.name} (${option.quantity} in stock)`}
            value={selectedItem}
            onChange={(event, newValue) => setSelectedItem(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Product"
                required
                fullWidth
              />
            )}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <DatePicker
            label="Sale Date"
            value={formData.date}
            onChange={(newValue) => setFormData(prev => ({ ...prev, date: newValue }))}
            slotProps={{
              textField: {
                fullWidth: true,
                required: true
              }
            }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            required
            fullWidth
            label="Quantity"
            name="quantity"
            type="number"
            value={formData.quantity}
            onChange={handleChange}
            inputProps={{ min: "1" }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            required
            fullWidth
            label="Sale Price"
            name="salePrice"
            type="number"
            value={formData.salePrice}
            onChange={handleChange}
            InputProps={{
              startAdornment: <InputAdornment position="start">₦</InputAdornment>,
            }}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Customer Name"
            name="customerName"
            value={formData.customerName}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Customer Contact"
            name="customerContact"
            value={formData.customerContact}
            onChange={handleChange}
          />
        </Grid>

        <Grid item xs={12}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            sx={{ mt: 2 }}
          >
            Record Sale
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}

export default SalesForm;
