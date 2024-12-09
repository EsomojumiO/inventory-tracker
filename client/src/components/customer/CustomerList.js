import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Chip,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  IconButton
} from '@mui/material';
import {
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useCustomer } from '../../context/CustomerContext';

const CustomerList = ({ onCustomerSelect }) => {
  const { customers, loading, error, fetchCustomers } = useCustomer();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');

  // Refetch customers when component mounts
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredCustomers = useMemo(() => {
    if (!Array.isArray(customers)) {
      console.warn('Customers is not an array:', customers);
      return [];
    }
    
    return customers.filter(customer => {
      if (!searchTerm) return true;
      
      const searchFields = [
        customer.firstName,
        customer.lastName,
        customer.email,
        customer.phone,
        customer.businessName
      ].filter(Boolean);
      
      const searchString = searchFields.join(' ').toLowerCase();
      return searchString.includes(searchTerm.toLowerCase());
    });
  }, [customers, searchTerm]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!Array.isArray(customers) || customers.length === 0) {
    return (
      <Box p={3}>
        <Alert severity="info">No customers found. Add your first customer to get started.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <TableContainer>
          <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Business</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Total Spent</TableCell>
                <TableCell>Loyalty Points</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCustomers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((customer) => (
                  <TableRow
                    hover
                    onClick={() => onCustomerSelect?.(customer)}
                    role="checkbox"
                    tabIndex={-1}
                    key={customer._id}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonIcon sx={{ mr: 1 }} />
                        {`${customer.firstName || ''} ${customer.lastName || ''}`}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        {customer.email && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <EmailIcon sx={{ mr: 1, fontSize: 'small' }} />
                            {customer.email}
                          </Box>
                        )}
                        {customer.phone && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <PhoneIcon sx={{ mr: 1, fontSize: 'small' }} />
                            {customer.phone}
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {customer.businessName && (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <BusinessIcon sx={{ mr: 1 }} />
                          {customer.businessName}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={customer.type || 'N/A'}
                        color={customer.type === 'Business' ? 'primary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={customer.status || 'Active'}
                        color={customer.status === 'Active' ? 'success' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{customer.totalSpent}</TableCell>
                    <TableCell>{customer.loyaltyPoints}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredCustomers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default CustomerList;
