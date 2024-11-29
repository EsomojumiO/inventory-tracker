import React, { useState, useContext } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Typography,
  IconButton,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { generateDocument } from '../../utils/documentGenerator';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../context/AuthContext';

const DocumentManager = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuth();
  
  const [open, setOpen] = useState(false);
  const [documentType, setDocumentType] = useState('quotation');
  const [documentData, setDocumentData] = useState({
    customer: {
      name: '',
      address: '',
      phone: '',
      email: '',
    },
    items: [
      {
        name: '',
        quantity: 1,
        price: 0,
      },
    ],
    documentNumber: '',
    date: new Date(),
  });

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleCustomerChange = (field) => (event) => {
    setDocumentData((prev) => ({
      ...prev,
      customer: {
        ...prev.customer,
        [field]: event.target.value,
      },
    }));
  };

  const handleItemChange = (index, field) => (event) => {
    const newItems = [...documentData.items];
    newItems[index] = {
      ...newItems[index],
      [field]: field === 'name' ? event.target.value : Number(event.target.value),
    };
    setDocumentData((prev) => ({
      ...prev,
      items: newItems,
    }));
  };

  const addItem = () => {
    setDocumentData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          name: '',
          quantity: 1,
          price: 0,
        },
      ],
    }));
  };

  const removeItem = (index) => {
    setDocumentData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const generatePDF = () => {
    try {
      const businessInfo = {
        businessName: user.businessName,
        address: user.address,
        phone: user.phone,
        email: user.email,
        logo: user.logo,
        bankName: user.bankName,
        accountName: user.accountName,
        accountNumber: user.accountNumber,
      };

      const doc = generateDocument(documentData, documentType, businessInfo);
      doc.save(`${documentType}-${documentData.documentNumber}.pdf`);
      
      enqueueSnackbar(`${documentType.charAt(0).toUpperCase() + documentType.slice(1)} generated successfully!`, {
        variant: 'success',
      });
      
      handleClose();
    } catch (error) {
      console.error('Error generating document:', error);
      enqueueSnackbar('Error generating document. Please try again.', {
        variant: 'error',
      });
    }
  };

  return (
    <Box>
      <Button
        variant="contained"
        startIcon={<DescriptionIcon />}
        onClick={handleOpen}
        sx={{ mb: 2 }}
      >
        Generate Document
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          Generate {documentType.charAt(0).toUpperCase() + documentType.slice(1)}
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Document Type"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
              >
                <MenuItem value="quotation">Quotation</MenuItem>
                <MenuItem value="invoice">Invoice</MenuItem>
                <MenuItem value="receipt">Receipt</MenuItem>
              </TextField>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Document Number"
                value={documentData.documentNumber}
                onChange={(e) =>
                  setDocumentData((prev) => ({
                    ...prev,
                    documentNumber: e.target.value,
                  }))
                }
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Customer Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Customer Name"
                    value={documentData.customer.name}
                    onChange={handleCustomerChange('name')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={documentData.customer.email}
                    onChange={handleCustomerChange('email')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={documentData.customer.phone}
                    onChange={handleCustomerChange('phone')}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Address"
                    value={documentData.customer.address}
                    onChange={handleCustomerChange('address')}
                  />
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Items</Typography>
                <Button startIcon={<AddIcon />} onClick={addItem}>
                  Add Item
                </Button>
              </Box>
              
              {documentData.items.map((item, index) => (
                <Paper key={index} sx={{ p: 2, mb: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Item Name"
                        value={item.name}
                        onChange={handleItemChange(index, 'name')}
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Quantity"
                        value={item.quantity}
                        onChange={handleItemChange(index, 'quantity')}
                      />
                    </Grid>
                    <Grid item xs={12} sm={3}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Unit Price"
                        value={item.price}
                        onChange={handleItemChange(index, 'price')}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <IconButton
                        color="error"
                        onClick={() => removeItem(index)}
                        disabled={documentData.items.length === 1}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={generatePDF}
          >
            Generate PDF
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentManager;
