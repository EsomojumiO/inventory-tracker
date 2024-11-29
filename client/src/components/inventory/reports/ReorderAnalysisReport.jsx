import React, { useState, useEffect } from 'react';
import {
  Paper,
  Box,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Typography,
  Alert,
} from '@mui/material';
import {
  FileDownload as ExportIcon,
  Print as PrintIcon,
  ShoppingCart as OrderIcon,
} from '@mui/icons-material';
import { useReport } from '../../../context/ReportContext';

const ReorderAnalysisReport = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [reportData, setReportData] = useState([]);

  const { generateReorderAnalysisReport } = useReport();

  useEffect(() => {
    const data = generateReorderAnalysisReport();
    setReportData(data);
  }, [generateReorderAnalysisReport]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExport = (format) => {
    // TODO: Implement export functionality
    console.log(`Exporting in ${format} format`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCreateOrder = (items) => {
    // TODO: Implement order creation
    console.log('Creating order for items:', items);
  };

  return (
    <Box>
      {/* Summary and Actions */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Alert severity="warning">
            {reportData.length} items are below their reorder point and need attention.
          </Alert>
        </Grid>
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={() => handleExport('excel')}
            >
              Export Excel
            </Button>
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={() => handleExport('pdf')}
            >
              Export PDF
            </Button>
            <IconButton onClick={handlePrint}>
              <PrintIcon />
            </IconButton>
          </Box>
        </Grid>
      </Grid>

      {/* Bulk Actions */}
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<OrderIcon />}
          onClick={() => handleCreateOrder(reportData)}
          disabled={reportData.length === 0}
        >
          Create Purchase Orders for All Items
        </Button>
      </Box>

      {/* Report Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>SKU</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="right">Current Stock</TableCell>
              <TableCell align="right">Reorder Point</TableCell>
              <TableCell align="right">Suggested Order</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reportData
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.sku}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell align="right">{item.currentStock}</TableCell>
                  <TableCell align="right">{item.reorderPoint}</TableCell>
                  <TableCell align="right">{item.suggestedOrder}</TableCell>
                  <TableCell>{item.supplier}</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<OrderIcon />}
                      onClick={() => handleCreateOrder([item])}
                    >
                      Create Order
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={reportData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
};

export default ReorderAnalysisReport;
