import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import config from '../../config/config';

const initialFormState = {
  companyName: '',
  contactPerson: '',
  email: '',
  phone: '',
  address: ''
};

const SupplierManager = () => {
  const { token, isAuthenticated } = useAuth();
  const { notify } = useNotification();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [editingId, setEditingId] = useState(null);

  const fetchSuppliers = useCallback(async () => {
    if (!isAuthenticated) {
      setError('Please log in to view suppliers');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${config.apiUrl}${config.endpoints.suppliers}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch suppliers');
      }

      const data = await response.json();
      setSuppliers(data.suppliers || []);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      notify('Error loading suppliers: ' + err.message, 'error');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, isAuthenticated, notify]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSupplier = () => {
    setFormData(initialFormState);
    setEditingId(null);
    setOpenDialog(true);
  };

  const handleEditSupplier = (supplier) => {
    setFormData({
      companyName: supplier.companyName,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address
    });
    setEditingId(supplier._id);
    setOpenDialog(true);
  };

  const handleDeleteSupplier = async (supplierId) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        const response = await fetch(`${config.apiUrl}${config.endpoints.suppliers}/${supplierId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error('Failed to delete supplier');
        }

        notify('Supplier deleted successfully', 'success');
        fetchSuppliers();
      } catch (err) {
        console.error('Error deleting supplier:', err);
        notify('Error deleting supplier: ' + err.message, 'error');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingId 
        ? `${config.apiUrl}${config.endpoints.suppliers}/${editingId}`
        : `${config.apiUrl}${config.endpoints.suppliers}`;
      
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(editingId ? 'Failed to update supplier' : 'Failed to add supplier');
      }

      notify(
        editingId ? 'Supplier updated successfully' : 'Supplier added successfully',
        'success'
      );
      
      setOpenDialog(false);
      fetchSuppliers();
    } catch (err) {
      console.error('Error saving supplier:', err);
      notify('Error saving supplier: ' + err.message, 'error');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography component="h2" variant="h6" color="primary" gutterBottom>
                Supplier Management
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddSupplier}
              >
                Add Supplier
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Company Name</TableCell>
                    <TableCell>Contact Person</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Address</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {suppliers.map((supplier) => (
                    <TableRow key={supplier._id}>
                      <TableCell>{supplier.companyName}</TableCell>
                      <TableCell>{supplier.contactPerson}</TableCell>
                      <TableCell>{supplier.email}</TableCell>
                      <TableCell>{supplier.phone}</TableCell>
                      <TableCell>{supplier.address}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleEditSupplier(supplier)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteSupplier(supplier._id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingId ? 'Edit Supplier' : 'Add New Supplier'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                name="companyName"
                label="Company Name"
                value={formData.companyName}
                onChange={handleInputChange}
                required
                fullWidth
              />
              <TextField
                name="contactPerson"
                label="Contact Person"
                value={formData.contactPerson}
                onChange={handleInputChange}
                required
                fullWidth
              />
              <TextField
                name="email"
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                fullWidth
              />
              <TextField
                name="phone"
                label="Phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                fullWidth
              />
              <TextField
                name="address"
                label="Address"
                value={formData.address}
                onChange={handleInputChange}
                required
                fullWidth
                multiline
                rows={3}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {editingId ? 'Update' : 'Add'} Supplier
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default SupplierManager;
