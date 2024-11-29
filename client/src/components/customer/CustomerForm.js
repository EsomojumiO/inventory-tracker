import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Typography,
  Box,
  Divider,
  Chip
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const CustomerForm = ({ open, onClose, onSubmit, customer }) => {
  const initialFormState = {
    // Basic Information
    type: 'individual',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    
    // Business Details (for business customers)
    businessName: '',
    taxId: '',
    industry: '',
    website: '',
    
    // Address
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Nigeria',
      isShippingAddress: true,
      isBillingAddress: true
    },
    
    // Financial Information
    creditLimit: 0,
    paymentTerms: 'prepaid',
    preferredPaymentMethod: 'cash',
    
    // Communication Preferences
    communicationPreferences: {
      email: true,
      sms: true,
      whatsapp: true,
      marketing: true
    },
    
    // Custom Fields
    tags: [],
    notes: [],
    
    // Status and Category
    status: 'active',
    category: 'regular'
  };

  const [formData, setFormData] = useState(customer ? { 
    ...initialFormState, 
    ...customer,
    communicationPreferences: {
      ...initialFormState.communicationPreferences,
      ...(customer?.communicationPreferences || {})
    },
    address: {
      ...initialFormState.address,
      ...(customer?.address || {})
    }
  } : initialFormState);

  useEffect(() => {
    if (customer) {
      setFormData({
        ...initialFormState,
        ...customer,
        communicationPreferences: {
          ...initialFormState.communicationPreferences,
          ...(customer.communicationPreferences || {})
        },
        address: {
          ...initialFormState.address,
          ...(customer.address || {})
        }
      });
    } else {
      setFormData(initialFormState);
    }
  }, [customer]);

  const [newTag, setNewTag] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSwitchChange = (name) => (event) => {
    setFormData(prev => ({
      ...prev,
      [name]: event.target.checked
    }));
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      dateOfBirth: date
    }));
  };

  const handleAddTag = (event) => {
    if (event.key === 'Enter' && newTag.trim()) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleDeleteTag = (tagToDelete) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToDelete)
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {customer ? 'Edit Customer' : 'Add New Customer'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Customer Type</InputLabel>
                    <Select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      label="Customer Type"
                    >
                      <MenuItem value="individual">Individual</MenuItem>
                      <MenuItem value="business">Business</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="firstName"
                    label="First Name"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="lastName"
                    label="Last Name"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                {formData.type === 'business' && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        name="businessName"
                        label="Business Name"
                        value={formData.businessName}
                        onChange={handleChange}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        name="taxId"
                        label="Tax ID"
                        value={formData.taxId}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        name="industry"
                        label="Industry"
                        value={formData.industry}
                        onChange={handleChange}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        name="website"
                        label="Website"
                        value={formData.website}
                        onChange={handleChange}
                      />
                    </Grid>
                  </>
                )}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="email"
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="phone"
                    label="Phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="alternatePhone"
                    label="Alternate Phone"
                    value={formData.alternatePhone}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* Address */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Address
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="address.street"
                    label="Street Address"
                    value={formData.address.street}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="address.city"
                    label="City"
                    value={formData.address.city}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="address.state"
                    label="State/Province"
                    value={formData.address.state}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="address.postalCode"
                    label="Postal Code"
                    value={formData.address.postalCode}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="address.country"
                    label="Country"
                    value={formData.address.country}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.address.isShippingAddress}
                        onChange={handleSwitchChange('address.isShippingAddress')}
                      />
                    }
                    label="Is Shipping Address"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.address.isBillingAddress}
                        onChange={handleSwitchChange('address.isBillingAddress')}
                      />
                    }
                    label="Is Billing Address"
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* Financial Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Financial Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name="creditLimit"
                    label="Credit Limit"
                    type="number"
                    value={formData.creditLimit}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Payment Terms</InputLabel>
                    <Select
                      name="paymentTerms"
                      value={formData.paymentTerms}
                      onChange={handleChange}
                      label="Payment Terms"
                    >
                      <MenuItem value="prepaid">Prepaid</MenuItem>
                      <MenuItem value="postpaid">Postpaid</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Preferred Payment Method</InputLabel>
                    <Select
                      name="preferredPaymentMethod"
                      value={formData.preferredPaymentMethod}
                      onChange={handleChange}
                      label="Preferred Payment Method"
                    >
                      <MenuItem value="cash">Cash</MenuItem>
                      <MenuItem value="bankTransfer">Bank Transfer</MenuItem>
                      <MenuItem value="creditCard">Credit Card</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* Communication Preferences */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Communication Preferences
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.communicationPreferences.email}
                        onChange={handleSwitchChange('communicationPreferences.email')}
                      />
                    }
                    label="Email"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.communicationPreferences.sms}
                        onChange={handleSwitchChange('communicationPreferences.sms')}
                      />
                    }
                    label="SMS"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.communicationPreferences.whatsapp}
                        onChange={handleSwitchChange('communicationPreferences.whatsapp')}
                      />
                    }
                    label="Whatsapp"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.communicationPreferences.marketing}
                        onChange={handleSwitchChange('communicationPreferences.marketing')}
                      />
                    }
                    label="Marketing"
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* Custom Fields */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Additional Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Add Tags"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={handleAddTag}
                    helperText="Press Enter to add a tag"
                  />
                  <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {formData.tags.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        onDelete={() => handleDeleteTag(tag)}
                      />
                    ))}
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="notes"
                    label="Notes"
                    multiline
                    rows={4}
                    value={formData.notes}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      label="Status"
                    >
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="inactive">Inactive</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      label="Category"
                    >
                      <MenuItem value="regular">Regular</MenuItem>
                      <MenuItem value="premium">Premium</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            {customer ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CustomerForm;
