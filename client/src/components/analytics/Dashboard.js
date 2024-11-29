import React, { useState, useEffect } from 'react';
import {
    Grid,
    Paper,
    Typography,
    Box,
    Card,
    CardContent,
    IconButton,
    TextField,
    MenuItem
} from '@mui/material';
import {
    TrendingUp,
    ShoppingCart,
    Inventory,
    Group,
    Warning
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ChartComponent from './ChartComponent';
import axios from 'axios';

const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ height: '100%' }}>
        <CardContent>
            <Grid container spacing={2} alignItems="center">
                <Grid item>
                    <IconButton
                        sx={{
                            backgroundColor: `${color}20`,
                            '&:hover': { backgroundColor: `${color}30` }
                        }}
                    >
                        {icon}
                    </IconButton>
                </Grid>
                <Grid item xs>
                    <Typography color="textSecondary" variant="subtitle2" gutterBottom>
                        {title}
                    </Typography>
                    <Typography variant="h4">{value}</Typography>
                </Grid>
            </Grid>
        </CardContent>
    </Card>
);

const Dashboard = () => {
    const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)));
    const [endDate, setEndDate] = useState(new Date());
    const [groupBy, setGroupBy] = useState('day');
    const [dashboardData, setDashboardData] = useState(null);
    const [salesData, setSalesData] = useState([]);
    const [productData, setProductData] = useState([]);
    const [customerData, setCustomerData] = useState([]);
    const [paymentData, setPaymentData] = useState([]);

    const fetchDashboardData = async () => {
        try {
            const response = await axios.get('/api/analytics/dashboard');
            setDashboardData(response.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }
    };

    const fetchAnalyticsData = async () => {
        try {
            const [sales, products, customers, payments] = await Promise.all([
                axios.get('/api/analytics/sales', {
                    params: {
                        startDate: startDate.toISOString(),
                        endDate: endDate.toISOString(),
                        groupBy
                    }
                }),
                axios.get('/api/analytics/products', {
                    params: {
                        startDate: startDate.toISOString(),
                        endDate: endDate.toISOString()
                    }
                }),
                axios.get('/api/analytics/customers', {
                    params: {
                        startDate: startDate.toISOString(),
                        endDate: endDate.toISOString()
                    }
                }),
                axios.get('/api/analytics/payments', {
                    params: {
                        startDate: startDate.toISOString(),
                        endDate: endDate.toISOString()
                    }
                })
            ]);

            setSalesData(sales.data);
            setProductData(products.data);
            setCustomerData(customers.data);
            setPaymentData(payments.data);
        } catch (error) {
            console.error('Error fetching analytics data:', error);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    useEffect(() => {
        fetchAnalyticsData();
    }, [startDate, endDate, groupBy]);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(value);
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                    {/* Date Range Selector */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 2 }}>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item>
                                    <DatePicker
                                        label="Start Date"
                                        value={startDate}
                                        onChange={setStartDate}
                                        renderInput={(params) => <TextField {...params} />}
                                    />
                                </Grid>
                                <Grid item>
                                    <DatePicker
                                        label="End Date"
                                        value={endDate}
                                        onChange={setEndDate}
                                        renderInput={(params) => <TextField {...params} />}
                                    />
                                </Grid>
                                <Grid item>
                                    <TextField
                                        select
                                        label="Group By"
                                        value={groupBy}
                                        onChange={(e) => setGroupBy(e.target.value)}
                                    >
                                        <MenuItem value="day">Day</MenuItem>
                                        <MenuItem value="week">Week</MenuItem>
                                        <MenuItem value="month">Month</MenuItem>
                                    </TextField>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* Stats Cards */}
                    {dashboardData && (
                        <>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatCard
                                    title="Daily Sales"
                                    value={formatCurrency(dashboardData.dailySales.totalSales)}
                                    icon={<TrendingUp />}
                                    color="#0088FE"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatCard
                                    title="Orders Today"
                                    value={dashboardData.dailySales.orderCount}
                                    icon={<ShoppingCart />}
                                    color="#00C49F"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatCard
                                    title="Total Products"
                                    value={dashboardData.totalProducts}
                                    icon={<Inventory />}
                                    color="#FFBB28"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <StatCard
                                    title="Active Customers"
                                    value={dashboardData.activeCustomers}
                                    icon={<Group />}
                                    color="#FF8042"
                                />
                            </Grid>
                        </>
                    )}

                    {/* Charts */}
                    <Grid item xs={12} md={8}>
                        <Paper sx={{ p: 2 }}>
                            <ChartComponent
                                type="multiLine"
                                data={salesData}
                                title="Sales & Profit Trends"
                                xDataKey="_id"
                                height={400}
                            />
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2 }}>
                            <ChartComponent
                                type="pie"
                                data={paymentData}
                                title="Payment Methods"
                                xDataKey="paymentMethod"
                                yDataKey="totalAmount"
                                height={400}
                            />
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2 }}>
                            <ChartComponent
                                type="bar"
                                data={productData.slice(0, 10)}
                                title="Top 10 Products by Revenue"
                                xDataKey="name"
                                yDataKey="totalRevenue"
                                height={400}
                            />
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2 }}>
                            <ChartComponent
                                type="bar"
                                data={customerData.slice(0, 10)}
                                title="Top 10 Customers by Purchase Value"
                                xDataKey="name"
                                yDataKey="totalPurchases"
                                height={400}
                            />
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </LocalizationProvider>
    );
};

export default Dashboard;
