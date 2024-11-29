import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Typography,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon } from '@mui/icons-material';
import { useInventory } from '../context/InventoryContext';
import './InventoryTable.css';

const InventoryTable = () => {
  const { inventory, addProduct, updateProduct, deleteProduct, formatCurrency } = useInventory();
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [stockFilter, setStockFilter] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    category: '',
    supplier: '',
    sku: '',
    reorderPoint: '',
    unitCost: ''
  });

  // Get unique categories and suppliers from inventory
  const categories = useMemo(() => {
    const uniqueCategories = new Set(inventory.map(item => item.category));
    return ['all', ...Array.from(uniqueCategories)];
  }, [inventory]);

  const suppliers = useMemo(() => {
    const uniqueSuppliers = new Set(inventory.map(item => item.supplier).filter(Boolean));
    return Array.from(uniqueSuppliers);
  }, [inventory]);

  // Filter inventory based on search and filters
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      // Search term filter
      const matchesSearch = 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase());

      // Category filter
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;

      // Price range filter
      const matchesPrice = 
        (!priceRange.min || item.price >= Number(priceRange.min)) &&
        (!priceRange.max || item.price <= Number(priceRange.max));

      // Stock level filter
      const matchesStock = (() => {
        switch (stockFilter) {
          case 'out':
            return item.quantity === 0;
          case 'low':
            return item.quantity > 0 && item.quantity <= 10;
          case 'in':
            return item.quantity > 10;
          default:
            return true;
        }
      })();

      return matchesSearch && matchesCategory && matchesPrice && matchesStock;
    });
  }, [inventory, searchTerm, categoryFilter, priceRange, stockFilter]);

  const handleOpen = (item = null) => {
    if (item) {
      setEditItem(item);
      setFormData(item);
    } else {
      setEditItem(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        quantity: '',
        category: '',
        supplier: '',
        sku: '',
        reorderPoint: '',
        unitCost: ''
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditItem(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      quantity: '',
      category: '',
      supplier: '',
      sku: '',
      reorderPoint: '',
      unitCost: ''
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const productData = {
      ...formData,
      price: Number(formData.price),
      quantity: Number(formData.quantity),
      unitCost: Number(formData.unitCost),
      reorderPoint: Number(formData.reorderPoint)
    };

    if (editItem) {
      updateProduct({ ...productData, id: editItem.id });
    } else {
      addProduct(productData);
    }
    handleClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Box className="inventory-container">
      <Box className="inventory-header">
        <Typography variant="h5" className="inventory-title">
          Inventory Management
        </Typography>
        <Button variant="contained" color="primary" onClick={() => handleOpen()}>
          Add New Product
        </Button>
      </Box>

      {/* Search and Filters */}
      <Box className="filters-container">
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              label="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-field"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon className="search-icon" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth className="filter-select">
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Category"
              >
                {categories.map(category => (
                  <MenuItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Min Price"
                  type="number"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                  className="price-range-field"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₦</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Max Price"
                  type="number"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                  className="price-range-field"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₦</InputAdornment>,
                  }}
                />
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth className="filter-select">
              <InputLabel>Stock Level</InputLabel>
              <Select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                label="Stock Level"
              >
                <MenuItem value="all">All Stock Levels</MenuItem>
                <MenuItem value="out">Out of Stock</MenuItem>
                <MenuItem value="low">Low Stock (≤10)</MenuItem>
                <MenuItem value="in">In Stock (>10)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('all');
                setPriceRange({ min: '', max: '' });
                setStockFilter('all');
              }}
              className="clear-filters-btn"
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Box>

      <TableContainer component={Paper} className="inventory-table">
        <Table>
          <TableHead>
            <TableRow className="table-header">
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Unit Cost</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredInventory.map((item) => (
              <TableRow 
                key={item.id}
                className={`table-row ${
                  item.quantity === 0 
                    ? 'out-of-stock-row' 
                    : item.quantity <= 10 
                    ? 'low-stock-row' 
                    : ''
                }`}
              >
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.supplier}</TableCell>
                <TableCell>{item.sku}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography 
                      color={item.quantity <= item.reorderPoint ? 'error' : 'inherit'}
                    >
                      {item.quantity}
                    </Typography>
                    {item.quantity <= item.reorderPoint && (
                      <Typography variant="caption" color="error" sx={{ ml: 1 }}>
                        Low Stock
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>{formatCurrency(item.unitCost)}</TableCell>
                <TableCell>{formatCurrency(item.price)}</TableCell>
                <TableCell>
                  <IconButton 
                    onClick={() => handleOpen(item)} 
                    size="small"
                    className="action-button"
                  >
                    <EditIcon className="edit-icon" />
                  </IconButton>
                  <IconButton 
                    onClick={() => deleteProduct(item.id)} 
                    size="small"
                    className="action-button"
                  >
                    <DeleteIcon className="delete-icon" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="dialog-title">
          {editItem ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent className="dialog-content">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="SKU"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                  >
                    {categories.filter(cat => cat !== 'all').map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Supplier</InputLabel>
                  <Select
                    name="supplier"
                    value={formData.supplier}
                    onChange={handleChange}
                  >
                    {suppliers.map((supplier) => (
                      <MenuItem key={supplier} value={supplier}>
                        {supplier}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Unit Cost"
                  name="unitCost"
                  type="number"
                  value={formData.unitCost}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Price"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Quantity"
                  name="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Reorder Point"
                  name="reorderPoint"
                  type="number"
                  value={formData.reorderPoint}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions className="dialog-actions">
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editItem ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default InventoryTable;
