import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Grid,
    Box,
    Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const SaleDetailsDialog = ({ open, onClose, sale }) => {
    if (!sale) return null;

    const formatDate = (date) => {
        return new Date(date).toLocaleString();
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">Sale Details</Typography>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent>
                <Grid container spacing={2}>
                    {/* Sale Information */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 2, mb: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Sale Information
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" color="textSecondary">
                                        Sale ID
                                    </Typography>
                                    <Typography variant="body1">
                                        {sale._id}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" color="textSecondary">
                                        Date
                                    </Typography>
                                    <Typography variant="body1">
                                        {formatDate(sale.createdAt)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" color="textSecondary">
                                        Payment Method
                                    </Typography>
                                    <Typography variant="body1">
                                        {sale.paymentMethod}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" color="textSecondary">
                                        Total Amount
                                    </Typography>
                                    <Typography variant="body1">
                                        {formatCurrency(sale.total)}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* Customer Information */}
                    {sale.customer && (
                        <Grid item xs={12}>
                            <Paper sx={{ p: 2, mb: 2 }}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Customer Information
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body2" color="textSecondary">
                                            Name
                                        </Typography>
                                        <Typography variant="body1">
                                            {sale.customer.name}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="body2" color="textSecondary">
                                            Email
                                        </Typography>
                                        <Typography variant="body1">
                                            {sale.customer.email}
                                        </Typography>
                                    </Grid>
                                    {sale.customer.phone && (
                                        <Grid item xs={12} sm={6}>
                                            <Typography variant="body2" color="textSecondary">
                                                Phone
                                            </Typography>
                                            <Typography variant="body1">
                                                {sale.customer.phone}
                                            </Typography>
                                        </Grid>
                                    )}
                                </Grid>
                            </Paper>
                        </Grid>
                    )}

                    {/* Items */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Items
                            </Typography>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Product</TableCell>
                                            <TableCell>Category</TableCell>
                                            <TableCell align="right">Quantity</TableCell>
                                            <TableCell align="right">Unit Price</TableCell>
                                            <TableCell align="right">Subtotal</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {sale.items.map((item) => (
                                            <TableRow key={item.product._id}>
                                                <TableCell>{item.product.name}</TableCell>
                                                <TableCell>{item.product.category}</TableCell>
                                                <TableCell align="right">{item.quantity}</TableCell>
                                                <TableCell align="right">
                                                    {formatCurrency(item.price)}
                                                </TableCell>
                                                <TableCell align="right">
                                                    {formatCurrency(item.quantity * item.price)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {/* Total Summary */}
                            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default' }}>
                                <Grid container spacing={1}>
                                    <Grid item xs={12}>
                                        <Box display="flex" justifyContent="space-between">
                                            <Typography variant="subtitle1">
                                                Subtotal
                                            </Typography>
                                            <Typography variant="subtitle1">
                                                {formatCurrency(sale.subtotal)}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    {sale.tax > 0 && (
                                        <Grid item xs={12}>
                                            <Box display="flex" justifyContent="space-between">
                                                <Typography variant="subtitle1">
                                                    Tax
                                                </Typography>
                                                <Typography variant="subtitle1">
                                                    {formatCurrency(sale.tax)}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    )}
                                    <Grid item xs={12}>
                                        <Divider sx={{ my: 1 }} />
                                        <Box display="flex" justifyContent="space-between">
                                            <Typography variant="h6">
                                                Total
                                            </Typography>
                                            <Typography variant="h6">
                                                {formatCurrency(sale.total)}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </DialogContent>
        </Dialog>
    );
};

export default SaleDetailsDialog;
