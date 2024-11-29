import React, { useState } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Tooltip,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useInventory } from '../../../context/InventoryContext';

const ReorderList = ({ onEditReorder }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock reorder data
  const reorders = [
    {
      id: 1,
      productName: 'Product A',
      supplier: 'Supplier A',
      quantity: 100,
      status: 'Pending',
      expectedDate: new Date(),
      createdAt: new Date(),
    },
    {
      id: 2,
      productName: 'Product B',
      supplier: 'Supplier B',
      quantity: 50,
      status: 'In Transit',
      expectedDate: new Date(),
      createdAt: new Date(),
    },
    // Add more mock data as needed
  ];

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'info';
      case 'in transit':
        return 'primary';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const filteredReorders = reorders.filter((reorder) =>
    reorder.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reorder.supplier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search reorders..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Product</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Expected Date</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredReorders
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((reorder) => (
                <TableRow key={reorder.id}>
                  <TableCell>{reorder.id}</TableCell>
                  <TableCell>{reorder.productName}</TableCell>
                  <TableCell>{reorder.supplier}</TableCell>
                  <TableCell>{reorder.quantity}</TableCell>
                  <TableCell>
                    <Chip
                      label={reorder.status}
                      color={getStatusColor(reorder.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {format(reorder.expectedDate, 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    {format(reorder.createdAt, 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => onEditReorder(reorder)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error">
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredReorders.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </>
  );
};

export default ReorderList;
