import React, { useState, useEffect } from 'react';
import {
    Box,
    Container,
    Grid,
    Paper,
    Typography,
    Button,
    IconButton,
    Card,
    CardContent,
    CardActions,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Tooltip,
    Divider,
    useTheme,
} from '@mui/material';
import {
    TrendingUp,
    Inventory,
    ShoppingCart,
    LocalShipping,
    Assessment,
    Notifications,
    Add as AddIcon,
    Receipt as ReceiptIcon,
    MoneyOff as RefundIcon,
    Warning as WarningIcon,
    ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';
import { useSales } from '../../context/SalesContext';
import { useAuth } from '../../hooks/useAuth';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ChartTooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import { formatNaira, formatChartValue, formatPercentage } from '../../utils/currencyUtils';

const DashboardCard = ({ title, value, icon, color, onClick }) => (
    <Card sx={{ height: '100%', cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
        <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="h6" color="text.secondary" gutterBottom>
                    {title}
                </Typography>
                {icon && (
                    <IconButton sx={{ color: color || 'primary.main' }}>
                        {icon}
                    </IconButton>
                )}
            </Box>
            <Typography variant="h4" component="div">
                {value}
            </Typography>
        </CardContent>
    </Card>
);

const QuickActionButton = ({ icon, label, onClick }) => (
    <Button
        variant="outlined"
        startIcon={icon}
        onClick={onClick}
        sx={{ width: '100%', justifyContent: 'flex-start', mb: 1 }}
    >
        {label}
    </Button>
);

const MainDashboard = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { inventory } = useInventory();
    const { sales } = useSales();
    const [notifications, setNotifications] = useState([]);

    // Mock data for demonstration
    const salesData = [
        { name: 'Mon', value: 4000 },
        { name: 'Tue', value: 3000 },
        { name: 'Wed', value: 2000 },
        { name: 'Thu', value: 2780 },
        { name: 'Fri', value: 1890 },
        { name: 'Sat', value: 2390 },
        { name: 'Sun', value: 3490 },
    ];

    const paymentMethodsData = [
        { name: 'Cash', value: 400 },
        { name: 'Card', value: 300 },
        { name: 'Mobile Money', value: 300 },
        { name: 'Transfer', value: 200 },
    ];

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    useEffect(() => {
        // Fetch notifications
        setNotifications([
            {
                id: 1,
                type: 'warning',
                message: '5 items are running low on stock',
                time: '5 minutes ago',
            },
            {
                id: 2,
                type: 'info',
                message: 'New supplier order arrived',
                time: '1 hour ago',
            },
        ]);
    }, []);

    const handleQuickAction = (action) => {
        switch (action) {
            case 'add_product':
                navigate('/inventory/products');
                break;
            case 'generate_invoice':
                navigate('/pos');
                break;
            case 'process_refund':
                navigate('/pos');
                break;
            case 'view_reports':
                navigate('/inventory/reports');
                break;
            default:
                break;
        }
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
                {/* Overview Cards */}
                <Grid item xs={12} md={3}>
                    <DashboardCard
                        title="Today's Sales"
                        value={formatNaira(3450)}
                        icon={<TrendingUp />}
                        color="success.main"
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <DashboardCard
                        title="Items in Stock"
                        value="1,234"
                        icon={<Inventory />}
                        color="info.main"
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <DashboardCard
                        title="Today's Orders"
                        value="45"
                        icon={<ShoppingCart />}
                        color="warning.main"
                    />
                </Grid>
                <Grid item xs={12} md={3}>
                    <DashboardCard
                        title="Pending Deliveries"
                        value="8"
                        icon={<LocalShipping />}
                        color="error.main"
                    />
                </Grid>

                {/* Charts */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>
                            Sales Trend
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={salesData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis tickFormatter={(value) => formatChartValue(value)} />
                                <ChartTooltip formatter={(value) => [formatNaira(value), "Amount"]} />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke={theme.palette.primary.main}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Quick Actions */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>
                            Quick Actions
                        </Typography>
                        <QuickActionButton
                            icon={<AddIcon />}
                            label="Add Product"
                            onClick={() => handleQuickAction('add_product')}
                        />
                        <QuickActionButton
                            icon={<ReceiptIcon />}
                            label="Generate Invoice"
                            onClick={() => handleQuickAction('generate_invoice')}
                        />
                        <QuickActionButton
                            icon={<RefundIcon />}
                            label="Process Refund"
                            onClick={() => handleQuickAction('process_refund')}
                        />
                        <QuickActionButton
                            icon={<Assessment />}
                            label="View Reports"
                            onClick={() => handleQuickAction('view_reports')}
                        />
                    </Paper>
                </Grid>

                {/* Payment Methods Chart */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>
                            Payment Methods
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={paymentMethodsData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {paymentMethodsData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <ChartTooltip formatter={(value) => [formatNaira(value), "Amount"]} />
                            </PieChart>
                        </ResponsiveContainer>
                        <Box sx={{ mt: 2 }}>
                            {paymentMethodsData.map((entry, index) => (
                                <Box
                                    key={entry.name}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        mb: 1,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 12,
                                            height: 12,
                                            borderRadius: '50%',
                                            backgroundColor: COLORS[index % COLORS.length],
                                            mr: 1,
                                        }}
                                    />
                                    <Typography variant="body2">
                                        {entry.name}: {entry.value}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Paper>
                </Grid>

                {/* Notifications */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>
                            Recent Notifications
                        </Typography>
                        <List>
                            {notifications.map((notification) => (
                                <React.Fragment key={notification.id}>
                                    <ListItem>
                                        <ListItemIcon>
                                            {notification.type === 'warning' ? (
                                                <WarningIcon color="warning" />
                                            ) : (
                                                <Notifications color="info" />
                                            )}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={notification.message}
                                            secondary={notification.time}
                                        />
                                        <IconButton size="small">
                                            <ArrowForwardIcon />
                                        </IconButton>
                                    </ListItem>
                                    <Divider />
                                </React.Fragment>
                            ))}
                        </List>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default MainDashboard;
