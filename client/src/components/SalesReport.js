import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import config from '../config/config';

const SalesReport = () => {
  const { getToken } = useAuth();
  const { showError, showSuccess } = useNotification();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [period, setPeriod] = useState('daily');
  const [customDate, setCustomDate] = useState(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const token = getToken();
      
      let url = `${config.API_BASE_URL}/api/sales/report?period=${period}`;
      if (period === 'custom' && customDate) {
        url += `&startDate=${customDate.toISOString()}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch report');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch report');
      }

      setReportData(data.data);
    } catch (error) {
      showError('Error fetching report: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [period, customDate]);

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.text('Sales Report', 14, 15);
      
      // Add summary
      doc.setFontSize(12);
      doc.text(`Period: ${reportData.period.start.split('T')[0]} to ${reportData.period.end.split('T')[0]}`, 14, 25);
      doc.text(`Total Sales: ${reportData.summary.totalSales}`, 14, 32);
      doc.text(`Total Revenue: $${reportData.summary.totalRevenue.toFixed(2)}`, 14, 39);
      doc.text(`Average Order Value: $${reportData.summary.averageOrderValue.toFixed(2)}`, 14, 46);

      // Sales by Category
      const categoryData = Object.entries(reportData.salesByCategory).map(([category, data]) => [
        category,
        data.count,
        `$${data.revenue.toFixed(2)}`
      ]);

      doc.autoTable({
        startY: 55,
        head: [['Category', 'Units Sold', 'Revenue']],
        body: categoryData,
        headStyles: { fillColor: [66, 66, 66] }
      });

      // Sales by Day
      const dailyData = Object.entries(reportData.salesByDay).map(([date, data]) => [
        date,
        data.count,
        `$${data.revenue.toFixed(2)}`
      ]);

      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 15,
        head: [['Date', 'Number of Sales', 'Revenue']],
        body: dailyData,
        headStyles: { fillColor: [66, 66, 66] }
      });

      doc.save(`sales-report-${period}-${new Date().toISOString().split('T')[0]}.pdf`);
      showSuccess('PDF report generated successfully');
    } catch (error) {
      showError('Error generating PDF: ' + error.message);
    }
  };

  const downloadCSV = async () => {
    try {
      setLoading(true);
      const token = getToken();
      
      let url = `${config.API_BASE_URL}/api/sales/report?period=${period}&format=csv`;
      if (period === 'custom' && customDate) {
        url += `&startDate=${customDate.toISOString()}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to download CSV');
      }

      // Create a blob from the response
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `sales-report-${period}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      showSuccess('CSV downloaded successfully');
    } catch (error) {
      showError('Error downloading CSV: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Sales Report
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              label="Period"
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="custom">Custom</MenuItem>
            </Select>
          </FormControl>
          
          {period === 'custom' && (
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={customDate}
                onChange={setCustomDate}
                renderInput={(params) => <TextField {...params} />}
              />
            </LocalizationProvider>
          )}

          <Button
            variant="contained"
            onClick={exportToPDF}
            disabled={loading || !reportData}
          >
            Export to PDF
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={downloadCSV}
            disabled={loading}
          >
            Export to CSV
          </Button>
        </Box>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {reportData && !loading && (
        <>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Summary
            </Typography>
            <Typography>
              Period: {new Date(reportData.period.start).toLocaleDateString()} to {new Date(reportData.period.end).toLocaleDateString()}
            </Typography>
            <Typography>
              Total Sales: {reportData.summary.totalSales}
            </Typography>
            <Typography>
              Total Revenue: ${reportData.summary.totalRevenue.toFixed(2)}
            </Typography>
            <Typography>
              Average Order Value: ${reportData.summary.averageOrderValue.toFixed(2)}
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Sales by Category
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Units Sold</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(reportData.salesByCategory).map(([category, data]) => (
                    <TableRow key={category}>
                      <TableCell>{category}</TableCell>
                      <TableCell align="right">{data.count}</TableCell>
                      <TableCell align="right">${data.revenue.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>
              Daily Sales
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Number of Sales</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(reportData.salesByDay).map(([date, data]) => (
                    <TableRow key={date}>
                      <TableCell>{new Date(date).toLocaleDateString()}</TableCell>
                      <TableCell align="right">{data.count}</TableCell>
                      <TableCell align="right">${data.revenue.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </>
      )}
    </Box>
  );
};

export default SalesReport;
