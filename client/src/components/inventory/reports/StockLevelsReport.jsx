import React, { useState, useEffect } from 'react';
import {
  Paper,
  Box,
  Grid,
  TextField,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
} from '@mui/material';
import {
  FileDownload as ExportIcon,
  Print as PrintIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { useReport } from '../../../context/ReportContext';
import { useInventory } from '../../../context/InventoryContext';

const StockLevelsReport = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    category: '',
    status: '',
  });
  const [reportData, setReportData] = useState([]);

  const { generateStockLevelsReport } = useReport();
  const { categories } = useInventory();

  useEffect(() => {
    const data = generateStockLevelsReport(filters);
    setReportData(data);
  }, [filters, generateStockLevelsReport]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleExport = (format) => {
    // TODO: Implement export functionality
    console.log(`Exporting in ${format} format`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Box>
      {/* Filters and Actions */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            fullWidth
            name="category"
            label="Category"
            value={filters.category}
            onChange={handleFilterChange}
          >
            <MenuItem value="">All Categories</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            select
            fullWidth
            name="status"
            label="Stock Status"
            value={filters.status}
            onChange={handleFilterChange}
          >
            <MenuItem value="">All Status</MenuItem>
            <MenuItem value="Low Stock">Low Stock</MenuItem>
            <MenuItem value="Normal">Normal</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Box sx={{ display: 'flex', gap: 1 }}>
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
              <TableCell>Status</TableCell>
              <TableCell align="right">Value</TableCell>
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
                  <TableCell>
                    <Chip
                      label={item.status}
                      color={item.status === 'Low Stock' ? 'error' : 'success'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    ${item.value.toLocaleString()}
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

export default StockLevelsReport;
