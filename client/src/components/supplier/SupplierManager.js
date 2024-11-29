import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Card,
  CardContent,
  Tooltip,
  Chip,
  Fade,
  TablePagination,
  InputAdornment,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import config from '../../config/config';

const SupplierManager = () => {
  const { user } = useAuth();
  const { showError, showSuccess } = useNotification();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      zipCode: ''
    },
    paymentTerms: 'net30',
    status: 'active',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [totalSuppliers, setTotalSuppliers] = useState(0);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.code.trim()) {
      newErrors.code = 'Code is required';
    } else if (!/^[A-Z0-9]{3,10}$/.test(formData.code)) {
      newErrors.code = 'Code must be 3-10 characters, uppercase letters and numbers only';
    }
    
    if (!formData.contactPerson.trim()) {
      newErrors.contactPerson = 'Contact person is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!/^\+?[\d\s-]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone format (minimum 10 digits)';
    }

    // Add validation for address fields
    const address = formData.address || {};
    if (!address.street?.trim()) {
      newErrors['address.street'] = 'Street address is required';
    }
    if (!address.city?.trim()) {
      newErrors['address.city'] = 'City is required';
    }
    if (!address.country?.trim()) {
      newErrors['address.country'] = 'Country is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const fetchSuppliers = useCallback(async () => {
    if (!user?.token) {
      showError('Please log in to view suppliers');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const url = new URL(`${config.API_BASE_URL}/api/suppliers`);
      url.searchParams.append('page', page + 1);
      url.searchParams.append('limit', rowsPerPage);
      if (searchTerm) url.searchParams.append('search', searchTerm);

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch suppliers');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch suppliers');
      }

      setSuppliers(data.suppliers || []);
      setTotalSuppliers(data.total || 0);
    } catch (error) {
      console.error('Supplier fetch error:', error);
      showError('Error loading suppliers: ' + error.message);
      setSuppliers([]);
      setTotalSuppliers(0);
    } finally {
      setLoading(false);
    }
  }, [user, showError, page, rowsPerPage, searchTerm]);

  useEffect(() => {
    if (user?.token) {
      fetchSuppliers();
    }
  }, [fetchSuppliers, user]);

  const handleAddSupplier = async () => {
    if (!validateForm()) return;

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/suppliers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add supplier');
      }

      await fetchSuppliers();
      showSuccess('Supplier added successfully');
      handleCloseDialog();
    } catch (error) {
      showError(error.message);
      // Set specific field errors if they exist
      if (error.message.includes('code')) {
        setErrors(prev => ({ ...prev, code: error.message }));
      }
      if (error.message.includes('email')) {
        setErrors(prev => ({ ...prev, email: error.message }));
      }
    }
  };

  const handleUpdateSupplier = async () => {
    if (!validateForm()) return;

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/suppliers/${selectedSupplier._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update supplier');
      }

      await fetchSuppliers();
      showSuccess('Supplier updated successfully');
      handleCloseDialog();
    } catch (error) {
      showError('Error updating supplier: ' + error.message);
    }
  };

  const handleDeleteSupplier = async (id) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/suppliers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete supplier');
      }

      await fetchSuppliers();
      showSuccess('Supplier deleted successfully');
    } catch (error) {
      showError('Error deleting supplier: ' + error.message);
    }
  };

  const handleOpenDialog = (supplier = null) => {
    if (supplier) {
      setFormData(supplier);
      setSelectedSupplier(supplier);
    } else {
      setFormData({
        name: '',
        code: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: {
          street: '',
          city: '',
          state: '',
          country: '',
          zipCode: ''
        },
        paymentTerms: 'net30',
        status: 'active',
        notes: ''
      });
      setSelectedSupplier(null);
    }
    setErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedSupplier(null);
    setFormData({
      name: '',
      code: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: {
        street: '',
        city: '',
        state: '',
        country: '',
        zipCode: ''
      },
      paymentTerms: 'net30',
      status: 'active',
      notes: ''
    });
    setErrors({});
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'code' ? value.toUpperCase() : value
      }));
    }
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedSupplier) {
      await handleUpdateSupplier();
    } else {
      await handleAddSupplier();
    }
  };

  const handleDelete = async (supplierId) => {
    await handleDeleteSupplier(supplierId);
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.phone.includes(searchTerm)
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Card sx={{ mt: 3, mb: 4 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" component="h2">
                  Supplier Management
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenDialog()}
                >
                  Add New Supplier
                </Button>
              </Box>
              <Divider sx={{ mb: 3 }} />
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Contact Information</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSuppliers
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((supplier) => (
                    <TableRow key={supplier._id} hover>
                      <TableCell>
                        <Chip label={supplier.code} color="primary" size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="subtitle2">{supplier.name}</Typography>
                        <Typography variant="caption" color="textSecondary">
                          Contact: {supplier.contactPerson}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" flexDirection="column" gap={1}>
                          {supplier.email && (
                            <Box display="flex" alignItems="center" gap={1}>
                              <EmailIcon fontSize="small" color="action" />
                              <Typography variant="body2">{supplier.email}</Typography>
                            </Box>
                          )}
                          {supplier.phone && (
                            <Box display="flex" alignItems="center" gap={1}>
                              <PhoneIcon fontSize="small" color="action" />
                              <Typography variant="body2">{supplier.phone}</Typography>
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {supplier.address && (
                          <Box display="flex" alignItems="center" gap={1}>
                            <LocationIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              {`${supplier.address.street}, ${supplier.address.city}`}
                              <br />
                              {`${supplier.address.state}, ${supplier.address.country} ${supplier.address.zipCode}`}
                            </Typography>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={supplier.status}
                          size="small"
                          color={
                            supplier.status === 'active'
                              ? 'success'
                              : supplier.status === 'inactive'
                              ? 'default'
                              : 'error'
                          }
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton onClick={() => handleOpenDialog(supplier)} size="small">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            onClick={() => handleDelete(supplier._id)}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={totalSuppliers}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md" 
        fullWidth
        TransitionComponent={Fade}
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {selectedSupplier ? 'Edit Supplier' : 'Add New Supplier'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  name="name"
                  label="Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  error={!!errors.name}
                  helperText={errors.name}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="code"
                  label="Code"
                  value={formData.code}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  error={!!errors.code}
                  helperText={errors.code}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="contactPerson"
                  label="Contact Person"
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  error={!!errors.contactPerson}
                  helperText={errors.contactPerson}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="email"
                  label="Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  error={!!errors.email}
                  helperText={errors.email}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="phone"
                  label="Phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  fullWidth
                  required
                  error={!!errors.phone}
                  helperText={errors.phone}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="address.street"
                  label="Street"
                  value={formData.address.street}
                  onChange={handleInputChange}
                  fullWidth
                  error={!!errors['address.street']}
                  helperText={errors['address.street']}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="address.city"
                  label="City"
                  value={formData.address.city}
                  onChange={handleInputChange}
                  fullWidth
                  error={!!errors['address.city']}
                  helperText={errors['address.city']}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="address.state"
                  label="State"
                  value={formData.address.state}
                  onChange={handleInputChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="address.country"
                  label="Country"
                  value={formData.address.country}
                  onChange={handleInputChange}
                  fullWidth
                  error={!!errors['address.country']}
                  helperText={errors['address.country']}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="address.zipCode"
                  label="Zip Code"
                  value={formData.address.zipCode}
                  onChange={handleInputChange}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="notes"
                  label="Notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Add any additional notes about the supplier..."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={handleCloseDialog} variant="outlined">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={selectedSupplier ? <EditIcon /> : <AddIcon />}
            >
              {selectedSupplier ? 'Update Supplier' : 'Add Supplier'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default SupplierManager;
