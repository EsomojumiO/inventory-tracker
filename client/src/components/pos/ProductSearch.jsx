import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Typography,
  Chip,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/formatCurrency';
import { useInventory } from '../../context/InventoryContext';

const ProductSearch = ({ searchQuery, setSearchQuery, onProductSelect }) => {
  const { inventory, loading } = useInventory();
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredProducts([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = inventory.filter(product =>
      product.name.toLowerCase().includes(query) ||
      product.barcode?.includes(query) ||
      product.sku?.toLowerCase().includes(query)
    );

    setFilteredProducts(results);
  }, [searchQuery, inventory]);

  const handleClear = () => {
    setSearchQuery('');
    setFilteredProducts([]);
  };

  return (
    <Box>
      <TextField
        fullWidth
        label="Search Products"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: searchQuery && (
            <InputAdornment position="end">
              <IconButton onClick={handleClear} size="small">
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper
          sx={{
            mt: 2,
            maxHeight: 400,
            overflowY: 'auto',
            visibility: filteredProducts.length > 0 ? 'visible' : 'hidden',
          }}
        >
          <List>
            {filteredProducts.map((product) => (
              <ListItem
                key={product.id}
                divider
                button
                onClick={() => onProductSelect(product)}
              >
                <ListItemText
                  primary={product.name}
                  secondary={
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        {formatCurrency(product.price)}
                      </Typography>
                      <Chip
                        size="small"
                        label={`Stock: ${product.stockQuantity}`}
                        color={product.stockQuantity > 0 ? 'success' : 'error'}
                      />
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    onClick={(e) => {
                      e.stopPropagation();
                      onProductSelect(product);
                    }}
                    disabled={product.stockQuantity === 0}
                  >
                    <AddIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default ProductSearch;
