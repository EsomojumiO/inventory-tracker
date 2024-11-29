import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Tooltip,
  Card,
  CardContent,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileUpload as UploadIcon,
  Download as ExportIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useInventory } from '../../context/InventoryContext';
import StockAdjustmentDialog from './StockAdjustmentDialog';
import StockHistoryDialog from './StockHistoryDialog';
import { formatCurrency } from '../../utils/formatters';

const StockManagement = () => {
  const theme = useTheme();
  const { inventory, updateProduct } = useInventory();
  
  // State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStockStatus, setFilterStockStatus] = useState('all');
  const [isAdjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockAlerts, setStockAlerts] = useState([]);

  // Summary metrics
  const [summaryMetrics, setSummaryMetrics] = useState({
    totalItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    totalValue: 0
  });

  // Calculate summary metrics
  useEffect(() => {
    const metrics = inventory.reduce((acc, product) => {
      acc.totalItems += product.quantity;
      if (product.quantity === 0) acc.outOfStockItems++;
      if (product.quantity > 0 && product.quantity <= product.reorderPoint) acc.lowStockItems++;
      acc.totalValue += product.price * product.quantity;
      return acc;
    }, {
      totalItems: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      totalValue: 0
    });

    setSummaryMetrics(metrics);

    // Generate alerts
    const alerts = inventory
      .filter(product => 
        product.quantity === 0 || product.quantity <= product.reorderPoint
      )
      .map(product => ({
        id: product.id,
        message: product.quantity === 0 
          ? `${product.name} is out of stock!`
          : `${product.name} is running low (${product.quantity} remaining)`,
        severity: product.quantity === 0 ? 'error' : 'warning'
      }));

    setStockAlerts(alerts);
  }, [inventory]);

  // Filter products
  const filteredProducts = inventory.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory;
    
    const matchesStockStatus = (() => {
      switch (filterStockStatus) {
        case 'out':
          return product.quantity === 0;
        case 'low':
          return product.quantity > 0 && product.quantity <= product.reorderPoint;
        case 'in':
          return product.quantity > product.reorderPoint;
        default:
          return true;
      }
    })();

    return matchesSearch && matchesCategory && matchesStockStatus;
  });

  // Get unique categories
  const categories = ['all', ...new Set(inventory.map(product => product.category))];

  // Handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleAdjustStock = (product) => {
    setSelectedProduct(product);
    setAdjustmentDialogOpen(true);
  };

  const handleViewHistory = (product) => {
    setSelectedProduct(product);
    setHistoryDialogOpen(true);
  };

  const handleStockAdjustment = async (adjustmentData) => {
    try {
      const updatedProduct = {
        ...selectedProduct,
        quantity: selectedProduct.quantity + adjustmentData.quantity,
        stockHistory: [
          ...(selectedProduct.stockHistory || []),
          {
            date: new Date().toISOString(),
            type: adjustmentData.type,
            quantity: adjustmentData.quantity,
            notes: adjustmentData.notes
          }
        ]
      };

      await updateProduct(updatedProduct);
      setAdjustmentDialogOpen(false);
    } catch (error) {
      console.error('Error adjusting stock:', error);
      // Handle error (show notification)
    }
  };

  const exportStockReport = () => {
    const csvContent = [
      ['SKU', 'Name', 'Category', 'Current Stock', 'Reorder Point', 'Unit Price', 'Total Value'],
      ...filteredProducts.map(product => [
        product.sku,
        product.name,
        product.category,
        product.quantity,
        product.reorderPoint,
        product.price,
        product.price * product.quantity
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Container maxWidth="xl">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item>
            <Typography variant="h4" component="h1" gutterBottom>
              Stock Management
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={exportStockReport}
              sx={{ ml: 1 }}
            >
              Export Report
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Alerts */}
      {stockAlerts.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {stockAlerts.map((alert, index) => (
            <Alert 
              key={index} 
              severity={alert.severity}
              sx={{ mb: 1 }}
              action={
                <Button 
                  color="inherit" 
                  size="small"
                  onClick={() => handleAdjustStock(inventory.find(p => p.id === alert.id))}
                >
                  UPDATE STOCK
                </Button>
              }
            >
              {alert.message}
            </Alert>
          ))}
        </Box>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Stock Items
              </Typography>
              <Typography variant="h4">
                {summaryMetrics.totalItems}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Low Stock Items
              </Typography>
              <Typography variant="h4" color="warning.main">
                {summaryMetrics.lowStockItems}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Out of Stock Items
              </Typography>
              <Typography variant="h4" color="error.main">
                {summaryMetrics.outOfStockItems}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Stock Value
              </Typography>
              <Typography variant="h4">
                {formatCurrency(summaryMetrics.totalValue)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search by name or SKU"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                label="Category"
              >
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Stock Status</InputLabel>
              <Select
                value={filterStockStatus}
                onChange={(e) => setFilterStockStatus(e.target.value)}
                label="Stock Status"
              >
                <MenuItem value="all">All Stock</MenuItem>
                <MenuItem value="in">In Stock</MenuItem>
                <MenuItem value="low">Low Stock</MenuItem>
                <MenuItem value="out">Out of Stock</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Stock Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>SKU</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Current Stock</TableCell>
                <TableCell align="right">Reorder Point</TableCell>
                <TableCell align="right">Unit Price</TableCell>
                <TableCell align="right">Total Value</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProducts
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((product) => {
                  const isLowStock = product.quantity <= product.reorderPoint;
                  const isOutOfStock = product.quantity === 0;
                  
                  return (
                    <TableRow key={product.id}>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>
                        <Chip label={product.category} size="small" />
                      </TableCell>
                      <TableCell align="right">{product.quantity}</TableCell>
                      <TableCell align="right">{product.reorderPoint}</TableCell>
                      <TableCell align="right">{formatCurrency(product.price)}</TableCell>
                      <TableCell align="right">
                        {formatCurrency(product.price * product.quantity)}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                          color={isOutOfStock ? 'error' : isLowStock ? 'warning' : 'success'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Adjust Stock">
                          <IconButton
                            size="small"
                            onClick={() => handleAdjustStock(product)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View History">
                          <IconButton
                            size="small"
                            onClick={() => handleViewHistory(product)}
                          >
                            <HistoryIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredProducts.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>

      {/* Stock Adjustment Dialog */}
      <StockAdjustmentDialog
        open={isAdjustmentDialogOpen}
        onClose={() => setAdjustmentDialogOpen(false)}
        onSubmit={handleStockAdjustment}
        product={selectedProduct}
      />

      {/* Stock History Dialog */}
      <StockHistoryDialog
        open={isHistoryDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        product={selectedProduct}
      />
    </Container>
  );
};

export default StockManagement;
