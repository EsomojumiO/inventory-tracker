import React, { useState, useEffect } from 'react';
import { CSVLink } from 'react-csv';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  Box
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const InventoryReport = ({ items }) => {
  const { user } = useAuth();
  const [reportData, setReportData] = useState([]);
  const [totalValue, setTotalValue] = useState(0);

  useEffect(() => {
    if (items) {
      const data = items.map(item => ({
        Name: item.name,
        Category: item.category,
        Quantity: item.quantity,
        Price: `₦${item.price}`,
        Value: `₦${item.quantity * item.price}`
      }));
      setReportData(data);
      
      const total = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
      setTotalValue(total);
    }
  }, [items]);

  const headers = [
    { label: 'Name', key: 'Name' },
    { label: 'Category', key: 'Category' },
    { label: 'Quantity', key: 'Quantity' },
    { label: 'Price', key: 'Price' },
    { label: 'Total Value', key: 'Value' }
  ];

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text('Inventory Report', 14, 15);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 25);
    
    const tableData = reportData.map(item => [
      item.Name,
      item.Category,
      item.Quantity,
      item.Price,
      item.Value
    ]);

    doc.autoTable({
      head: [['Name', 'Category', 'Quantity', 'Price', 'Total Value']],
      body: tableData,
      startY: 35,
      theme: 'grid'
    });

    doc.text(`Total Inventory Value: ₦${totalValue.toLocaleString()}`, 14, doc.lastAutoTable.finalY + 10);
    doc.save('inventory-report.pdf');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Inventory Report
      </Typography>
      
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={generatePDF}
        >
          Download PDF
        </Button>
        
        <CSVLink
          data={reportData}
          headers={headers}
          filename="inventory-report.csv"
          style={{ textDecoration: 'none' }}
        >
          <Button variant="contained" color="secondary">
            Download CSV
          </Button>
        </CSVLink>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="right">Quantity</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="right">Total Value</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reportData.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.Name}</TableCell>
                <TableCell>{row.Category}</TableCell>
                <TableCell align="right">{row.Quantity}</TableCell>
                <TableCell align="right">{row.Price}</TableCell>
                <TableCell align="right">{row.Value}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={4} align="right">
                <strong>Total Inventory Value:</strong>
              </TableCell>
              <TableCell align="right">
                <strong>₦{totalValue.toLocaleString()}</strong>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default InventoryReport;
