import React, { useState, useMemo } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Grid,
  IconButton,
  Typography,
  Tooltip,
  TablePagination,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import dayjs from 'dayjs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { CSVLink } from 'react-csv';
import { useSales } from '../../context/SalesContext';

function SalesTable() {
  const [startDate, setStartDate] = useState(dayjs().subtract(30, 'day'));
  const [endDate, setEndDate] = useState(dayjs());
  const [searchTerm, setSearchTerm] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { sales, getSalesByDateRange, getTotalRevenue } = useSales();

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const saleDate = dayjs(sale.timestamp);
      const matchesDate = saleDate.isAfter(startDate) && saleDate.isBefore(endDate);
      const matchesSearch = sale.productName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCustomer = !customerFilter || 
        (sale.customerName && sale.customerName.toLowerCase().includes(customerFilter.toLowerCase()));
      
      return matchesDate && matchesSearch && matchesCustomer;
    });
  }, [sales, startDate, endDate, searchTerm, customerFilter]);

  const paginatedSales = useMemo(() => {
    return filteredSales.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  }, [filteredSales, page, rowsPerPage]);

  const totalRevenue = useMemo(() => {
    return getTotalRevenue(filteredSales);
  }, [filteredSales, getTotalRevenue]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const storeName = 'Retail Master';
    const reportTitle = 'Sales Report';
    const dateRange = `${startDate.format('YYYY-MM-DD')} to ${endDate.format('YYYY-MM-DD')}`;

    // Add store name and report title
    doc.setFontSize(20);
    doc.text(storeName, 105, 15, { align: 'center' });
    doc.setFontSize(16);
    doc.text(reportTitle, 105, 25, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Date Range: ${dateRange}`, 105, 35, { align: 'center' });
    doc.text(`Total Revenue: ₦${totalRevenue.toLocaleString()}`, 105, 45, { align: 'center' });

    // Add sales table
    doc.autoTable({
      startY: 55,
      head: [['ID', 'Item', 'Quantity', 'Price (₦)', 'Total (₦)', 'Date', 'Customer']],
      body: filteredSales.map(sale => [
        sale.id.slice(0, 8),
        sale.productName,
        sale.quantity,
        sale.salePrice.toLocaleString(),
        (sale.quantity * sale.salePrice).toLocaleString(),
        dayjs(sale.timestamp).format('YYYY-MM-DD HH:mm'),
        sale.customerName || '-'
      ]),
      theme: 'grid',
    });

    doc.save('sales-report.pdf');
  };

  const csvData = [
    ['Sale ID', 'Item', 'Quantity', 'Price (₦)', 'Total (₦)', 'Date', 'Customer'],
    ...filteredSales.map(sale => [
      sale.id,
      sale.productName,
      sale.quantity,
      sale.salePrice,
      sale.quantity * sale.salePrice,
      dayjs(sale.timestamp).format('YYYY-MM-DD HH:mm'),
      sale.customerName || '-'
    ])
  ];

  return (
    <Box>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" gutterBottom>
            Sales History
          </Typography>
          <Typography variant="h6" color="primary">
            Total Revenue: ₦{totalRevenue.toLocaleString()}
          </Typography>
        </Grid>

        <Grid item xs={12} md={3}>
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={setStartDate}
            maxDate={endDate}
            slotProps={{
              textField: {
                fullWidth: true,
                size: "small"
              }
            }}
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={setEndDate}
            minDate={startDate}
            maxDate={dayjs()}
            slotProps={{
              textField: {
                fullWidth: true,
                size: "small"
              }
            }}
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            size="small"
            label="Search Items"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Grid>

        <Grid item xs={12} md={3}>
          <TextField
            fullWidth
            size="small"
            label="Filter by Customer"
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
          />
        </Grid>
      </Grid>

      <Box sx={{ mb: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
        <CSVLink
          data={csvData}
          filename="sales-report.csv"
          style={{ textDecoration: 'none' }}
        >
          <Tooltip title="Export to CSV">
            <IconButton color="primary">
              <FileDownloadIcon />
            </IconButton>
          </Tooltip>
        </CSVLink>
        <Tooltip title="Export to PDF">
          <IconButton color="primary" onClick={exportToPDF}>
            <PictureAsPdfIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Item</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell align="right">Price (₦)</TableCell>
              <TableCell align="right">Total (₦)</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Customer</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedSales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell>{sale.id.slice(0, 8)}</TableCell>
                <TableCell>{sale.productName}</TableCell>
                <TableCell align="right">{sale.quantity}</TableCell>
                <TableCell align="right">{sale.salePrice.toLocaleString()}</TableCell>
                <TableCell align="right">
                  {(sale.quantity * sale.salePrice).toLocaleString()}
                </TableCell>
                <TableCell>{dayjs(sale.timestamp).format('YYYY-MM-DD HH:mm')}</TableCell>
                <TableCell>{sale.customerName || '-'}</TableCell>
              </TableRow>
            ))}
            {paginatedSales.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No sales found for the selected criteria
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filteredSales.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
    </Box>
  );
}

export default SalesTable;
