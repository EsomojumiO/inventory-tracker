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
  FormControl,
  InputLabel,
  Select,
  Chip,
  Box,
  Rating,
  Typography,
} from '@mui/material';
import { useSupplier } from '../../context/SupplierContext';

const categories = [
  'Electronics',
  'Office Supplies',
  'Furniture',
  'General Merchandise',
  'Accessories',
  'Food & Beverage',
  'Packaging',
  'Raw Materials',
];

const paymentTerms = ['Net 30', 'Net 45', 'Net 60', 'Immediate'];

const initialFormState = {
  name: '',
  contactPerson: '',
  email: '',
  phone: '',
  address: '',
  categories: [],
  rating: 0,
  status: 'active',
  paymentTerms: 'Net 30',
  deliveryTime: '',
  notes: '',
};

const SupplierForm = ({ open, onClose, supplier = null }) => {
  const [formData, setFormData] = useState(initialFormState);
  const { addSupplier, updateSupplier } = useSupplier();

  useEffect(() => {
    if (supplier) {
      setFormData(supplier);
    } else {
      setFormData(initialFormState);
    }
  }, [supplier]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (supplier) {
        await updateSupplier(supplier.id, formData);
      } else {
        await addSupplier(formData);
      }
      onClose();
    } catch (error) {
      console.error('Error saving supplier:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {supplier ? 'Edit Supplier' : 'Add New Supplier'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="name"
                label="Supplier Name"
                value={formData.name}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="contactPerson"
                label="Contact Person"
                value={formData.contactPerson}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="email"
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="phone"
                label="Phone"
                value={formData.phone}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="address"
                label="Address"
                value={formData.address}
                onChange={handleChange}
                fullWidth
                multiline
                rows={2}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Categories</InputLabel>
                <Select
                  multiple
                  name="categories"
                  value={formData.categories}
                  onChange={handleChange}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} />
                      ))}
                    </Box>
                  )}
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Terms</InputLabel>
                <Select
                  name="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={handleChange}
                >
                  {paymentTerms.map((term) => (
                    <MenuItem key={term} value={term}>
                      {term}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="deliveryTime"
                label="Delivery Time (e.g., 3-5 days)"
                value={formData.deliveryTime}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <Box>
                <Typography component="legend">Rating</Typography>
                <Rating
                  name="rating"
                  value={formData.rating}
                  onChange={(event, newValue) => {
                    handleChange({
                      target: { name: 'rating', value: newValue },
                    });
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="notes"
                label="Notes"
                value={formData.notes}
                onChange={handleChange}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            {supplier ? 'Update' : 'Add'} Supplier
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default SupplierForm;
