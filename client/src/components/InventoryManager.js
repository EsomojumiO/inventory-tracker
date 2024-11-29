import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, Grid, Paper, Typography, Box, CircularProgress, 
  TableContainer, Table, TableHead, TableRow, TableCell, 
  TableBody, Button, IconButton, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import config from '../config/config';

const categories = [
  'Electronics',
  'Clothing',
  'Food & Beverages',
  'Home & Garden',
  'Books',
  'Sports & Outdoors',
  'Toys & Games',
  'Health & Beauty',
  'Automotive',
  'Other'
];

const initialFormState = {
  name: '',
  sku: '',
  category: '',
  quantity: 0,
  price: 0,
  description: '',
  minQuantity: 0
};

const InventoryManager = () => {
  const { token, isAuthenticated } = useAuth();
  const { notify } = useNotification();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [editingId, setEditingId] = useState(null);

  const fetchItems = useCallback(async () => {
    if (!isAuthenticated) {
      setError('Please log in to view inventory');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${config.apiUrl}${config.endpoints.inventory}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch inventory items');
      }

      const data = await response.json();
      setItems(data.items || []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      notify('Error loading inventory: ' + err.message, 'error');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, isAuthenticated, notify]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'quantity' || name === 'minQuantity' 
        ? Number(value) 
        : value
    }));
  };

  const handleAddItem = () => {
    setFormData(initialFormState);
    setEditingId(null);
    setOpenDialog(true);
  };

  const handleEditItem = (item) => {
    setFormData({
      name: item.name,
      sku: item.sku,
      category: item.category,
      quantity: item.quantity,
      price: item.price,
      description: item.description || '',
      minQuantity: item.minQuantity || 0
    });
    setEditingId(item._id);
    setOpenDialog(true);
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const response = await fetch(`${config.apiUrl}${config.endpoints.inventory}/${itemId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error('Failed to delete item');
        }

        notify('Item deleted successfully', 'success');
        fetchItems();
      } catch (err) {
        console.error('Error deleting item:', err);
        notify('Error deleting item: ' + err.message, 'error');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingId 
        ? `${config.apiUrl}${config.endpoints.inventory}/${editingId}`
        : `${config.apiUrl}${config.endpoints.inventory}`;
      
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
        throw new Error(editingId ? 'Failed to update item' : 'Failed to add item');
      }

      notify(
        editingId ? 'Item updated successfully' : 'Item added successfully',
        'success'
      );
      
      setOpenDialog(false);
      fetchItems();
    } catch (err) {
      console.error('Error saving item:', err);
      notify('Error saving item: ' + err.message, 'error');
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
                Inventory Management
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddItem}
              >
                Add Item
              </Button>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Item Name</TableCell>
                    <TableCell>SKU</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">${item.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                          color={item.quantity > 0 ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleEditItem(item)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteItem(item._id)}
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
            {editingId ? 'Edit Item' : 'Add New Item'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                name="name"
                label="Item Name"
                value={formData.name}
                onChange={handleInputChange}
                required
                fullWidth
              />
              <TextField
                name="sku"
                label="SKU"
                value={formData.sku}
                onChange={handleInputChange}
                required
                fullWidth
              />
              <TextField
                name="category"
                label="Category"
                select
                value={formData.category}
                onChange={handleInputChange}
                required
                fullWidth
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                name="quantity"
                label="Quantity"
                type="number"
                value={formData.quantity}
                onChange={handleInputChange}
                required
                fullWidth
                inputProps={{ min: 0 }}
              />
              <TextField
                name="minQuantity"
                label="Minimum Quantity"
                type="number"
                value={formData.minQuantity}
                onChange={handleInputChange}
                required
                fullWidth
                inputProps={{ min: 0 }}
              />
              <TextField
                name="price"
                label="Price"
                type="number"
                value={formData.price}
                onChange={handleInputChange}
                required
                fullWidth
                inputProps={{ min: 0, step: 0.01 }}
              />
              <TextField
                name="description"
                label="Description"
                value={formData.description}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {editingId ? 'Update' : 'Add'} Item
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default InventoryManager;
