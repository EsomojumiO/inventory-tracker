import React, { useState, useEffect } from 'react';
import {
  Paper,
  Box,
  Grid,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
} from '@mui/material';
import {
  FileDownload as ExportIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useReport } from '../../../context/ReportContext';

const StockMovementReport = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [reportData, setReportData] = useState([]);

  const { generateStockMovementReport } = useReport();

  useEffect(() => {
    if (startDate && endDate) {
      const data = generateStockMovementReport({ startDate, endDate });
      setReportData(data);
    }
  }, [startDate, endDate, generateStockMovementReport]);

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

  const calculateNetChange = (item) => {
    return item.received + item.adjusted - item.sold;
  };

  return (
    <Box>
      {/* Filters and Actions */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={setStartDate}
            renderInput={(params) => <TextField {...params} fullWidth />}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={setEndDate}
            renderInput={(params) => <TextField {...params} fullWidth />}
          />
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
              <TableCell align="right">Opening Stock</TableCell>
              <TableCell align="right">Received</TableCell>
              <TableCell align="right">Sold</TableCell>
              <TableCell align="right">Adjusted</TableCell>
              <TableCell align="right">Net Change</TableCell>
              <TableCell align="right">Closing Stock</TableCell>
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
                  <TableCell align="right">{item.opening}</TableCell>
                  <TableCell align="right">{item.received}</TableCell>
                  <TableCell align="right">{item.sold}</TableCell>
                  <TableCell align="right">{item.adjusted}</TableCell>
                  <TableCell align="right">{calculateNetChange(item)}</TableCell>
                  <TableCell align="right">{item.closing}</TableCell>
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

export default StockMovementReport;
