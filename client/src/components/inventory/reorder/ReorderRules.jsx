import React, { useState } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Switch,
  FormControlLabel,
  Box,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useInventory } from '../../../context/InventoryContext';

const RuleForm = ({ open, onClose, rule = null }) => {
  const [formData, setFormData] = useState(
    rule || {
      productId: '',
      minStockLevel: '',
      reorderQuantity: '',
      autoReorder: false,
      notifyThreshold: '',
    }
  );

  const { inventory } = useInventory();

  const handleChange = (event) => {
    const { name, value, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'autoReorder' ? checked : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // TODO: Implement rule submission
    console.log('Submitting rule:', formData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {rule ? 'Edit Reorder Rule' : 'Create Reorder Rule'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Product</InputLabel>
                <Select
                  name="productId"
                  value={formData.productId}
                  onChange={handleChange}
                  required
                >
                  {inventory.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Minimum Stock Level"
                name="minStockLevel"
                type="number"
                value={formData.minStockLevel}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Reorder Quantity"
                name="reorderQuantity"
                type="number"
                value={formData.reorderQuantity}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Notify at Stock Level"
                name="notifyThreshold"
                type="number"
                value={formData.notifyThreshold}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.autoReorder}
                    onChange={handleChange}
                    name="autoReorder"
                    color="primary"
                  />
                }
                label="Enable Automatic Reordering"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            {rule ? 'Update' : 'Create'} Rule
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

const ReorderRules = () => {
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const { inventory } = useInventory();

  // Mock rules data
  const rules = [
    {
      id: 1,
      productName: 'Product A',
      minStockLevel: 10,
      reorderQuantity: 50,
      autoReorder: true,
      notifyThreshold: 15,
    },
    {
      id: 2,
      productName: 'Product B',
      minStockLevel: 20,
      reorderQuantity: 100,
      autoReorder: false,
      notifyThreshold: 25,
    },
  ];

  const handleCreateRule = () => {
    setSelectedRule(null);
    setShowRuleForm(true);
  };

  const handleEditRule = (rule) => {
    setSelectedRule(rule);
    setShowRuleForm(true);
  };

  const handleCloseForm = () => {
    setShowRuleForm(false);
    setSelectedRule(null);
  };

  return (
    <>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="h6">Reorder Rules</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateRule}
        >
          Create Rule
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>Min Stock Level</TableCell>
              <TableCell>Reorder Quantity</TableCell>
              <TableCell>Notify Threshold</TableCell>
              <TableCell>Auto Reorder</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell>{rule.productName}</TableCell>
                <TableCell>{rule.minStockLevel}</TableCell>
                <TableCell>{rule.reorderQuantity}</TableCell>
                <TableCell>{rule.notifyThreshold}</TableCell>
                <TableCell>
                  <Switch
                    checked={rule.autoReorder}
                    disabled
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleEditRule(rule)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {showRuleForm && (
        <RuleForm
          open={showRuleForm}
          onClose={handleCloseForm}
          rule={selectedRule}
        />
      )}
    </>
  );
};

export default ReorderRules;
