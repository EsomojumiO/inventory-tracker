import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Add as AddIcon } from '@mui/icons-material';

const SalesTracker = ({ items, onRecordSale }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [quantity, setQuantity] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  const handleAddSaleItem = () => {
    if (selectedItem && quantity) {
      setSelectedItems([
        ...selectedItems,
        {
          ...selectedItem,
          saleQuantity: parseInt(quantity),
          totalPrice: selectedItem.price * parseInt(quantity),
        },
      ]);
      setSelectedItem(null);
      setQuantity('');
    }
  };

  const handleRecordSale = async () => {
    if (selectedItems.length > 0) {
      await onRecordSale({
        items: selectedItems,
        date: new Date(),
        totalRevenue: selectedItems.reduce((sum, item) => sum + item.totalPrice, 0),
      });
      setSelectedItems([]);
      setIsDialogOpen(false);
    }
  };

  // Sample data for the chart - replace with actual sales data
  const salesData = [
    { name: 'Mon', revenue: 4000 },
    { name: 'Tue', revenue: 3000 },
    { name: 'Wed', revenue: 2000 },
    { name: 'Thu', revenue: 2780 },
    { name: 'Fri', revenue: 1890 },
    { name: 'Sat', revenue: 2390 },
    { name: 'Sun', revenue: 3490 },
  ];

  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="h2">
          Sales Tracker
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsDialogOpen(true)}
        >
          Record Sale
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Sales Overview Cards */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Today's Revenue
              </Typography>
              <Typography variant="h4">
                ${salesData[salesData.length - 1].revenue.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Weekly Revenue
              </Typography>
              <Typography variant="h4">
                ${salesData.reduce((sum, day) => sum + day.revenue, 0).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Items Sold Today
              </Typography>
              <Typography variant="h4">
                42
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Sales Chart */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Weekly Sales Overview
            </Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Record Sale Dialog */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Record New Sale</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={items}
                  getOptionLabel={(option) => option.name}
                  value={selectedItem}
                  onChange={(_, newValue) => setSelectedItem(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Item" fullWidth />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  fullWidth
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  variant="contained"
                  onClick={handleAddSaleItem}
                  fullWidth
                  sx={{ height: '100%' }}
                >
                  Add
                </Button>
              </Grid>
            </Grid>

            {selectedItems.length > 0 && (
              <TableContainer sx={{ mt: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell align="right">{item.saleQuantity}</TableCell>
                        <TableCell align="right">${item.price.toFixed(2)}</TableCell>
                        <TableCell align="right">${item.totalPrice.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} align="right">
                        <strong>Total Revenue:</strong>
                      </TableCell>
                      <TableCell align="right">
                        <strong>
                          ${selectedItems
                            .reduce((sum, item) => sum + item.totalPrice, 0)
                            .toFixed(2)}
                        </strong>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleRecordSale}
            disabled={selectedItems.length === 0}
          >
            Record Sale
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalesTracker;
