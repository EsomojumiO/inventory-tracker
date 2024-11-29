import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Tab,
  Tabs,
  Box,
  useTheme,
} from '@mui/material';
import OrderHistory from './OrderHistory';
import SupportTickets from './SupportTickets';
import ProfileSettings from './ProfileSettings';
import { useAuth } from '../../context/AuthContext';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`customer-tabpanel-${index}`}
      aria-labelledby={`customer-tab-${index}`}
      {...other}
    >
      {value === index && <Box p={3}>{children}</Box>}
    </div>
  );
}

function CustomerPortal() {
  const [value, setValue] = useState(0);
  const [customerData, setCustomerData] = useState(null);
  const theme = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    fetchCustomerData();
  }, []);

  const fetchCustomerData = async () => {
    try {
      const response = await fetch(`/api/customers/${user.id}`);
      const data = await response.json();
      setCustomerData(data);
    } catch (error) {
      console.error('Error fetching customer data:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper
        elevation={3}
        sx={{
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Typography
          component="h1"
          variant="h4"
          color="primary"
          gutterBottom
          sx={{ mb: 3 }}
        >
          Customer Portal
        </Typography>

        <Tabs
          value={value}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          aria-label="customer portal tabs"
        >
          <Tab label="Order History" />
          <Tab label="Support Tickets" />
          <Tab label="Profile Settings" />
        </Tabs>

        <TabPanel value={value} index={0}>
          <OrderHistory />
        </TabPanel>
        <TabPanel value={value} index={1}>
          <SupportTickets />
        </TabPanel>
        <TabPanel value={value} index={2}>
          <ProfileSettings customer={customerData} onUpdate={fetchCustomerData} />
        </TabPanel>
      </Paper>
    </Container>
  );
}

export default CustomerPortal;
