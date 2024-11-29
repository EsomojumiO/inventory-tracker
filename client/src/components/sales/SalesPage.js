import React, { useState } from 'react';
import { Box, Container, Paper, Tab, Tabs, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import HistoryIcon from '@mui/icons-material/History';
import SalesForm from './SalesForm';
import SalesTable from './SalesTable';
import { useNotification } from '../../context/NotificationContext';
import { useInventory } from '../../context/InventoryContext';
import { useSales } from '../../context/SalesContext';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`sales-tabpanel-${index}`}
      aria-labelledby={`sales-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function SalesPage() {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const { showSuccess, showError } = useNotification();
  const { inventory, updateProduct } = useInventory();
  const { addSale } = useSales();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSaleSubmit = async (saleData) => {
    try {
      // Check inventory availability
      const item = inventory.find(i => i.id === saleData.itemId);
      if (!item) {
        showError('Item not found in inventory');
        return;
      }

      if (item.quantity < saleData.quantity) {
        showError(`Insufficient inventory. Only ${item.quantity} units available.`);
        return;
      }

      // Update inventory
      const updatedItem = {
        ...item,
        quantity: item.quantity - saleData.quantity
      };
      await updateProduct(updatedItem);

      // Record sale
      const sale = addSale({
        ...saleData,
        productId: item.id,
        productName: item.name,
        originalPrice: item.price,
      });

      if (sale) {
        showSuccess('Sale recorded successfully');
        setTabValue(1); // Switch to sales table view
      } else {
        throw new Error('Failed to record sale');
      }
    } catch (error) {
      showError('Failed to record sale. Please try again.');
      console.error('Sale recording error:', error);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<HistoryIcon />}
          onClick={() => navigate('/sales/history')}
        >
          View Full Sales History
        </Button>
      </Box>
      <Paper sx={{ 
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 2,
        boxShadow: (theme) => theme.shadows[2]
      }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Record Sale" />
          <Tab label="Sales History" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <SalesForm onSubmit={handleSaleSubmit} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <SalesTable />
        </TabPanel>
      </Paper>
    </Container>
  );
}

export default SalesPage;
