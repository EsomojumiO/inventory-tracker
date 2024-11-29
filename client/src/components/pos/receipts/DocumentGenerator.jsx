import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  IconButton,
  Typography,
  Box,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Close as CloseIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { useReceipt } from '../../../context/ReceiptContext';
import { useInventory } from '../../../context/InventoryContext';

const DOCUMENT_TYPES = {
  QUOTATION: 'quotation',
  INVOICE: 'invoice',
  CREDIT_NOTE: 'credit_note',
};

const DocumentGenerator = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [documentType, setDocumentType] = useState(DOCUMENT_TYPES.QUOTATION);
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    items: [],
    notes: '',
    terms: '',
    dueDate: '',
  });

  const { generateDocument } = useReceipt();
  const { inventory } = useInventory();

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setDocumentType(
      newValue === 0 ? DOCUMENT_TYPES.QUOTATION :
      newValue === 1 ? DOCUMENT_TYPES.INVOICE :
      DOCUMENT_TYPES.CREDIT_NOTE
    );
  };

  const handleSubmit = async () => {
    try {
      const documentData = {
        ...formData,
        type: documentType,
      };
      await generateDocument(documentData);
      onClose();
    } catch (error) {
      console.error('Error generating document:', error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: 3,
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Generate Document</Typography>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ mb: 3 }}
        >
          <Tab label="Quotation" />
          <Tab label="Invoice" />
          <Tab label="Credit Note" />
        </Tabs>

        <Grid container spacing={3}>
          {/* Customer Information */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Customer Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Customer Name"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customerName: e.target.value
                  }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Customer Email"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    customerEmail: e.target.value
                  }))}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Document Details */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Document Details
            </Typography>
            <Grid container spacing={2}>
              {documentType === DOCUMENT_TYPES.INVOICE && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Due Date"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      dueDate: e.target.value
                    }))}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Terms and Conditions"
                  value={formData.terms}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    terms: e.target.value
                  }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    notes: e.target.value
                  }))}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button
          startIcon={<PrintIcon />}
          onClick={() => {}}
        >
          Print
        </Button>
        <Button
          startIcon={<DownloadIcon />}
          onClick={() => {}}
        >
          Download
        </Button>
        <Button
          startIcon={<EmailIcon />}
          onClick={() => {}}
        >
          Email
        </Button>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
        >
          Generate {documentType.replace('_', ' ')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentGenerator;
