import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  IconButton,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Chip,
  Menu,
  MenuItem,
  Dialog,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  CloudUpload as UploadIcon,
  Download as ExportIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useInventory } from '../../context/InventoryContext';
import ProductList from './ProductList';
import ProductForm from './ProductForm';
import InventoryDashboard from './InventoryDashboard';
import BulkUploadDialog from './BulkUploadDialog';
import FilterDialog from './FilterDialog';
import { formatCurrency } from '../../utils/formatCurrency';

const InventoryManager = () => {
  const {
    inventory,
    addProduct,
    updateProduct,
    deleteProduct,
  } = useInventory();

  // State
  const [currentTab, setCurrentTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    stockLevel: 'all', // all, low, out
  });
  const [isProductFormOpen, setProductFormOpen] = useState(false);
  const [isFilterDialogOpen, setFilterDialogOpen] = useState(false);
  const [isBulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  // Filter products based on search and filters
  const filteredProducts = inventory.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !filters.category || product.category === filters.category;
    const matchesPrice = (!filters.minPrice || product.price >= Number(filters.minPrice)) &&
                        (!filters.maxPrice || product.price <= Number(filters.maxPrice));
    const matchesStock = filters.stockLevel === 'all' ||
                        (filters.stockLevel === 'low' && product.quantity <= 5) ||
                        (filters.stockLevel === 'out' && product.quantity === 0);

    return matchesSearch && matchesCategory && matchesPrice && matchesStock;
  });

  // Handlers
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setFilterDialogOpen(false);
  };

  const handleProductAction = (action, product = null) => {
    setSelectedProduct(product);
    if (action === 'add' || action === 'edit') {
      setProductFormOpen(true);
    }
  };

  const handleProductSubmit = (productData) => {
    if (selectedProduct) {
      updateProduct({ ...selectedProduct, ...productData });
    } else {
      addProduct(productData);
    }
    setProductFormOpen(false);
    setSelectedProduct(null);
  };

  const handleBulkUpload = (data) => {
    // Process bulk upload data
    data.forEach(product => addProduct(product));
    setBulkUploadOpen(false);
  };

  const handleExport = () => {
    // Implement CSV export
    const csvContent = [
      ['Name', 'Description', 'Price', 'Quantity', 'Category'],
      ...filteredProducts.map(p => [p.name, p.description, p.price, p.quantity, p.category])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventory.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item>
            <Typography variant="h4" component="h1" gutterBottom>
              Inventory Management
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleProductAction('add')}
              sx={{ mr: 1 }}
            >
              Add Product
            </Button>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => setBulkUploadOpen(true)}
              sx={{ mr: 1 }}
            >
              Bulk Upload
            </Button>
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={handleExport}
            >
              Export
            </Button>
          </Grid>
        </Grid>

        <Paper sx={{ mt: 2 }}>
          <Tabs value={currentTab} onChange={handleTabChange} centered>
            <Tab label="Products" />
            <Tab label="Dashboard" />
          </Tabs>
        </Paper>

        <Paper sx={{ mt: 2, p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search products..."
                value={searchQuery}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box display="flex" justifyContent="flex-end">
                <Button
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={() => setFilterDialogOpen(true)}
                  sx={{ mr: 1 }}
                >
                  Filters
                </Button>
                <IconButton onClick={() => {
                  setSearchQuery('');
                  setFilters({
                    category: '',
                    minPrice: '',
                    maxPrice: '',
                    stockLevel: 'all',
                  });
                }}>
                  <RefreshIcon />
                </IconButton>
              </Box>
            </Grid>
          </Grid>

          {Object.values(filters).some(v => v) && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" component="div" sx={{ mb: 1 }}>
                Active Filters:
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {filters.category && (
                  <Chip label={`Category: ${filters.category}`} onDelete={() => handleFilterChange({ ...filters, category: '' })} />
                )}
                {(filters.minPrice || filters.maxPrice) && (
                  <Chip 
                    label={`Price: ${filters.minPrice ? formatCurrency(filters.minPrice) : '0'} - ${filters.maxPrice ? formatCurrency(filters.maxPrice) : '∞'}`}
                    onDelete={() => handleFilterChange({ ...filters, minPrice: '', maxPrice: '' })}
                  />
                )}
                {filters.stockLevel !== 'all' && (
                  <Chip
                    label={`Stock: ${filters.stockLevel === 'low' ? 'Low Stock' : 'Out of Stock'}`}
                    onDelete={() => handleFilterChange({ ...filters, stockLevel: 'all' })}
                  />
                )}
              </Box>
            </Box>
          )}
        </Paper>
      </Box>

      {currentTab === 0 ? (
        <ProductList
          products={filteredProducts}
          onEdit={(product) => handleProductAction('edit', product)}
          onDelete={deleteProduct}
        />
      ) : (
        <InventoryDashboard products={inventory} />
      )}

      {/* Dialogs */}
      <ProductForm
        open={isProductFormOpen}
        onClose={() => {
          setProductFormOpen(false);
          setSelectedProduct(null);
        }}
        onSubmit={handleProductSubmit}
        product={selectedProduct}
      />

      <FilterDialog
        open={isFilterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        filters={filters}
        onApply={handleFilterChange}
      />

      <BulkUploadDialog
        open={isBulkUploadOpen}
        onClose={() => setBulkUploadOpen(false)}
        onUpload={handleBulkUpload}
      />
    </Container>
  );
};

export default InventoryManager;
