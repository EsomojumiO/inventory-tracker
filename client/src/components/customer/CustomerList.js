import React, { useState } from 'react';
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
  IconButton,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea
} from '@mui/material';
import {
  Search as SearchIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  Person as PersonIcon
} from '@mui/icons-material';

const CustomerList = ({ customers = [], onCustomerSelect }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredCustomers = (customers || []).filter(customer => {
    const searchString = searchTerm.toLowerCase();
    return (
      (customer.name || '').toLowerCase().includes(searchString) ||
      (customer.email || '').toLowerCase().includes(searchString) ||
      (customer.companyName || '').toLowerCase().includes(searchString) ||
      (customer.phone || '').toLowerCase().includes(searchString)
    );
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getCustomerTypeIcon = (type) => {
    return type === 'business' ? (
      <BusinessIcon color="action" />
    ) : (
      <PersonIcon color="action" />
    );
  };

  const renderTableView = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Customer</TableCell>
            <TableCell>Contact</TableCell>
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
                key={customer._id}
                hover
                onClick={() => onCustomerSelect(customer)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    {getCustomerTypeIcon(customer.type)}
                    <Box>
                      <Typography variant="subtitle1">
                        {customer.name}
                      </Typography>
                      {customer.companyName && (
                        <Typography variant="body2" color="textSecondary">
                          {customer.companyName}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    {customer.email && (
                      <IconButton size="small" title={customer.email}>
                        <EmailIcon fontSize="small" />
                      </IconButton>
                    )}
                    {customer.phone && (
                      <IconButton size="small" title={customer.phone}>
                        <PhoneIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={customer.type}
                    size="small"
                    color={customer.type === 'business' ? 'primary' : 'default'}
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={customer.status}
                    size="small"
                    color={
                      customer.status === 'active'
                        ? 'success'
                        : customer.status === 'inactive'
                        ? 'error'
                        : 'default'
                    }
                  />
                </TableCell>
                <TableCell>{formatCurrency(customer.totalSpent || 0)}</TableCell>
                <TableCell>{customer.loyaltyPoints || 0}</TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredCustomers.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </TableContainer>
  );

  const renderGridView = () => (
    <Grid container spacing={2}>
      {filteredCustomers
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        .map((customer) => (
          <Grid item xs={12} sm={6} md={4} key={customer._id}>
            <Card>
              <CardActionArea onClick={() => onCustomerSelect(customer)}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    {getCustomerTypeIcon(customer.type)}
                    <Typography variant="h6" component="div">
                      {customer.name}
                    </Typography>
                  </Box>
                  {customer.companyName && (
                    <Typography color="textSecondary" gutterBottom>
                      {customer.companyName}
                    </Typography>
                  )}
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    {customer.email && <EmailIcon fontSize="small" color="action" />}
                    <Typography variant="body2">{customer.email}</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    {customer.phone && <PhoneIcon fontSize="small" color="action" />}
                    <Typography variant="body2">{customer.phone}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Chip
                      label={customer.status}
                      size="small"
                      color={
                        customer.status === 'active'
                          ? 'success'
                          : customer.status === 'inactive'
                          ? 'error'
                          : 'default'
                      }
                    />
                    <Typography variant="subtitle1">
                      {formatCurrency(customer.totalSpent || 0)}
                    </Typography>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      <Grid item xs={12}>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredCustomers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Grid>
    </Grid>
  );

  return (
    <Box>
      <Box mb={3}>
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

      {renderTableView()}
    </Box>
  );
};

export default CustomerList;
