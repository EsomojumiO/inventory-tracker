import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Divider,
  Box,
  IconButton,
} from '@mui/material';
import {
  Close as CloseIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { useReceipt } from '../../../context/ReceiptContext';

const ReceiptViewer = ({ open, onClose, receipt }) => {
  const { RECEIPT_STATUS } = useReceipt();

  if (!receipt) return null;

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
          <Typography variant="h6">Receipt Details</Typography>
          <Box>
            <IconButton size="small" onClick={() => {}}>
              <PrintIcon />
            </IconButton>
            <IconButton size="small" onClick={() => {}}>
              <DownloadIcon />
            </IconButton>
            <IconButton size="small" onClick={() => {}}>
              <ShareIcon />
            </IconButton>
            <IconButton size="small" onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Header Section */}
          <Grid item xs={12}>
            <Box textAlign="center" mb={3}>
              <Typography variant="h5">COMPANY NAME</Typography>
              <Typography variant="body2">123 Business Street</Typography>
              <Typography variant="body2">City, State, ZIP</Typography>
              <Typography variant="body2">Phone: (123) 456-7890</Typography>
            </Box>
          </Grid>

          {/* Receipt Info */}
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2">Receipt Number:</Typography>
                <Typography variant="body1">{receipt.receiptNumber}</Typography>
              </Grid>
              <Grid item xs={6} textAlign="right">
                <Typography variant="subtitle2">Date:</Typography>
                <Typography variant="body1">
                  {new Date(receipt.createdAt).toLocaleDateString()}
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          {/* Customer Info */}
          <Grid item xs={12}>
            <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
              <Typography variant="subtitle2">Customer Information</Typography>
              <Typography variant="body1">{receipt.customerName}</Typography>
              <Typography variant="body2">{receipt.customerEmail}</Typography>
              <Typography variant="body2">{receipt.customerPhone}</Typography>
            </Box>
          </Grid>

          {/* Items */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>Items</Typography>
            <Divider />
            {receipt.items?.map((item, index) => (
              <Box key={index} sx={{ py: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body1">{item.name}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      SKU: {item.sku}
                    </Typography>
                  </Grid>
                  <Grid item xs={2} textAlign="right">
                    <Typography variant="body2">
                      {item.quantity} x {item.price}
                    </Typography>
                  </Grid>
                  <Grid item xs={4} textAlign="right">
                    <Typography variant="body1">
                      {item.quantity * item.price}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Grid>

          {/* Totals */}
          <Grid item xs={12}>
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={1}>
                <Grid item xs={8} textAlign="right">
                  <Typography variant="body1">Subtotal:</Typography>
                </Grid>
                <Grid item xs={4} textAlign="right">
                  <Typography variant="body1">{receipt.formattedSubtotal}</Typography>
                </Grid>
                <Grid item xs={8} textAlign="right">
                  <Typography variant="body1">Tax (7.5%):</Typography>
                </Grid>
                <Grid item xs={4} textAlign="right">
                  <Typography variant="body1">{receipt.formattedTax}</Typography>
                </Grid>
                <Grid item xs={8} textAlign="right">
                  <Typography variant="h6">Total:</Typography>
                </Grid>
                <Grid item xs={4} textAlign="right">
                  <Typography variant="h6">{receipt.formattedTotal}</Typography>
                </Grid>
              </Grid>
            </Box>
          </Grid>

          {/* Payment Info */}
          <Grid item xs={12}>
            <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Payment Method</Typography>
                  <Typography variant="body1">{receipt.paymentMethod}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Status</Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: receipt.status === RECEIPT_STATUS.PAID ? 'success.main' :
                             receipt.status === RECEIPT_STATUS.PENDING ? 'warning.main' :
                             'error.main'
                    }}
                  >
                    {receipt.status}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReceiptViewer;
