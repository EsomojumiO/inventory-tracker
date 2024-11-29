import React, { useState, useEffect } from 'react';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Button,
    Box,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    Tooltip,
    Pagination
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import config from '../config/config';
import SaleDetailsDialog from './SaleDetailsDialog';

const SalesHistory = () => {
    const { getToken } = useAuth();
    const { showError } = useNotification();
    const [loading, setLoading] = useState(false);
    const [sales, setSales] = useState([]);
    const [summary, setSummary] = useState({
        totalSales: 0,
        totalRevenue: 0,
        averageOrderValue: 0
    });
    const [filters, setFilters] = useState({
        startDate: null,
        endDate: null,
        category: '',
        productId: '',
        page: 1
    });
    const [pagination, setPagination] = useState({
        total: 0,
        pages: 1
    });
    const [categories, setCategories] = useState([]);
    const [selectedSale, setSelectedSale] = useState(null);
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

    useEffect(() => {
        fetchCategories();
        fetchSales();
    }, [filters.page]);

    const fetchCategories = async () => {
        try {
            const token = getToken();
            const response = await fetch(`${config.API_BASE_URL}/api/inventory/categories`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setCategories(data.categories);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchSales = async () => {
        try {
            setLoading(true);
            const token = getToken();

            let url = `${config.API_BASE_URL}/api/sales?page=${filters.page}`;
            if (filters.startDate) url += `&startDate=${filters.startDate.toISOString()}`;
            if (filters.endDate) url += `&endDate=${filters.endDate.toISOString()}`;
            if (filters.category) url += `&category=${filters.category}`;
            if (filters.productId) url += `&productId=${filters.productId}`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch sales data');
            }

            const data = await response.json();
            setSales(data.sales);
            setSummary(data.summary);
            setPagination(data.pagination);
        } catch (error) {
            showError('Error loading sales: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value,
            page: 1 // Reset to first page when filters change
        }));
    };

    const handleApplyFilters = () => {
        fetchSales();
    };

    const handleResetFilters = () => {
        setFilters({
            startDate: null,
            endDate: null,
            category: '',
            productId: '',
            page: 1
        });
        fetchSales();
    };

    const handleExportCSV = async () => {
        try {
            const token = getToken();
            let exportUrl = `${config.API_BASE_URL}/api/sales/report?format=csv`;
            if (filters.startDate) exportUrl += `&startDate=${filters.startDate.toISOString()}`;
            if (filters.endDate) exportUrl += `&endDate=${filters.endDate.toISOString()}`;

            const response = await fetch(exportUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to export sales data');
            }

            // Create a blob from the response
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = 'sales-report.csv';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);
        } catch (error) {
            showError('Error exporting sales: ' + error.message);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString();
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN'
        }).format(amount);
    };

    const handleViewDetails = (sale) => {
        setSelectedSale(sale);
        setDetailsDialogOpen(true);
    };

    const handleCloseDetails = () => {
        setDetailsDialogOpen(false);
        setSelectedSale(null);
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
                {/* Filters */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Sales History
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DatePicker
                                    label="Start Date"
                                    value={filters.startDate}
                                    onChange={(date) => handleFilterChange('startDate', date)}
                                    renderInput={(params) => <TextField {...params} />}
                                />
                                <DatePicker
                                    label="End Date"
                                    value={filters.endDate}
                                    onChange={(date) => handleFilterChange('endDate', date)}
                                    renderInput={(params) => <TextField {...params} />}
                                />
                            </LocalizationProvider>
                            <FormControl sx={{ minWidth: 200 }}>
                                <InputLabel>Category</InputLabel>
                                <Select
                                    value={filters.category}
                                    onChange={(e) => handleFilterChange('category', e.target.value)}
                                    label="Category"
                                >
                                    <MenuItem value="">All Categories</MenuItem>
                                    {categories.map((category) => (
                                        <MenuItem key={category} value={category}>
                                            {category}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <Button
                                variant="contained"
                                onClick={handleApplyFilters}
                                sx={{ height: 56 }}
                            >
                                Apply Filters
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={handleResetFilters}
                                sx={{ height: 56 }}
                            >
                                Reset
                            </Button>
                            <Button
                                variant="outlined"
                                startIcon={<DownloadIcon />}
                                onClick={handleExportCSV}
                                sx={{ height: 56, marginLeft: 'auto' }}
                            >
                                Export CSV
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                {/* Summary Cards */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6">Total Sales</Typography>
                        <Typography variant="h4">{summary.totalSales}</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6">Total Revenue</Typography>
                        <Typography variant="h4">{formatCurrency(summary.totalRevenue)}</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="h6">Average Order Value</Typography>
                        <Typography variant="h4">{formatCurrency(summary.averageOrderValue)}</Typography>
                    </Paper>
                </Grid>

                {/* Sales Table */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        {loading ? (
                            <Box display="flex" justifyContent="center" p={3}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Date</TableCell>
                                                <TableCell>Customer</TableCell>
                                                <TableCell>Items</TableCell>
                                                <TableCell align="right">Total</TableCell>
                                                <TableCell align="right">Payment Method</TableCell>
                                                <TableCell align="right">Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {sales.map((sale) => (
                                                <TableRow key={sale._id}>
                                                    <TableCell>{formatDate(sale.createdAt)}</TableCell>
                                                    <TableCell>
                                                        {sale.customer?.name || 'Anonymous'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {sale.items.length} items
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {formatCurrency(sale.total)}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {sale.paymentMethod}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Tooltip title="View Details">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleViewDetails(sale)}
                                                            >
                                                                <VisibilityIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                    <Pagination
                                        count={pagination.pages}
                                        page={filters.page}
                                        onChange={(e, page) => handleFilterChange('page', page)}
                                        color="primary"
                                    />
                                </Box>
                            </>
                        )}
                    </Paper>
                </Grid>
            </Grid>
            <SaleDetailsDialog
                open={detailsDialogOpen}
                onClose={handleCloseDetails}
                sale={selectedSale}
            />
        </Container>
    );
};

export default SalesHistory;
