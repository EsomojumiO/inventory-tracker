import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Grid
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';

const validationSchema = yup.object({
  method: yup.string().required('Payment method is required'),
  amountPaid: yup.number()
    .required('Amount paid is required')
    .min(0, 'Amount must be positive'),
  reference: yup.string().when('method', {
    is: (method) => method !== 'CASH',
    then: yup.string().required('Reference number is required')
  })
});

const PaymentDialog = ({ open, onClose, total }) => {
  const [change, setChange] = useState(0);

  const formik = useFormik({
    initialValues: {
      method: 'CASH',
      amountPaid: total,
      reference: ''
    },
    validationSchema,
    onSubmit: (values) => {
      handlePayment(values);
    },
  });

  const handlePayment = async (values) => {
    try {
      // Process payment and update order
      // This would typically involve calling your payment processing service
      
      // Close dialog and show success message
      onClose(true);
    } catch (error) {
      // Handle payment error
      console.error('Payment failed:', error);
    }
  };

  // Calculate change when amount paid changes
  React.useEffect(() => {
    if (formik.values.method === 'CASH') {
      setChange(Math.max(0, formik.values.amountPaid - total));
    } else {
      setChange(0);
    }
  }, [formik.values.amountPaid, formik.values.method, total]);

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
      <form onSubmit={formik.handleSubmit}>
        <DialogTitle>Process Payment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Total Amount: ₦{total.toFixed(2)}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  name="method"
                  value={formik.values.method}
                  onChange={formik.handleChange}
                  error={formik.touched.method && Boolean(formik.errors.method)}
                >
                  <MenuItem value="CASH">Cash</MenuItem>
                  <MenuItem value="CARD">Card</MenuItem>
                  <MenuItem value="TRANSFER">Bank Transfer</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                name="amountPaid"
                label="Amount Paid"
                type="number"
                value={formik.values.amountPaid}
                onChange={formik.handleChange}
                error={formik.touched.amountPaid && Boolean(formik.errors.amountPaid)}
                helperText={formik.touched.amountPaid && formik.errors.amountPaid}
              />
            </Grid>

            {formik.values.method !== 'CASH' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="reference"
                  label="Reference Number"
                  value={formik.values.reference}
                  onChange={formik.handleChange}
                  error={formik.touched.reference && Boolean(formik.errors.reference)}
                  helperText={formik.touched.reference && formik.errors.reference}
                />
              </Grid>
            )}

            {formik.values.method === 'CASH' && change > 0 && (
              <Grid item xs={12}>
                <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                  <Typography variant="h6" color="primary">
                    Change Due: ₦{change.toFixed(2)}
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => onClose(false)}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!formik.isValid || formik.isSubmitting}
          >
            Complete Payment
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PaymentDialog;
