import React, { useState, useMemo } from 'react';
import {
    Paper,
    Grid,
    Typography,
    Box,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import { usePromotions, PROMOTION_TYPES } from '../../../context/PromotionsContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const PromotionAnalytics = () => {
    const [timeRange, setTimeRange] = useState('30');
    const { getPromotionAnalytics, formatAmount } = usePromotions();

    const analytics = useMemo(() => {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(timeRange));
        return getPromotionAnalytics(startDate, endDate);
    }, [timeRange, getPromotionAnalytics]);

    const typeData = Object.entries(analytics.promotionsByType).map(([type, count]) => ({
        name: type,
        value: count,
    }));

    const topPromotionsData = analytics.topPromotions.map(promotion => ({
        name: promotion.name,
        redemptions: promotion.redemptionCount,
        discount: promotion.totalDiscountGiven,
    }));

    return (
        <Paper sx={{ p: 2, mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" color="primary">
                    Promotion Analytics
                </Typography>
                <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel>Time Range</InputLabel>
                    <Select
                        value={timeRange}
                        label="Time Range"
                        onChange={(e) => setTimeRange(e.target.value)}
                    >
                        <MenuItem value="7">Last 7 days</MenuItem>
                        <MenuItem value="30">Last 30 days</MenuItem>
                        <MenuItem value="90">Last 90 days</MenuItem>
                    </Select>
                </FormControl>
            </Box>

            <Grid container spacing={3}>
                {/* Summary Cards */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>
                                Total Promotions
                            </Typography>
                            <Typography variant="h4">
                                {analytics.totalPromotions}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>
                                Total Redemptions
                            </Typography>
                            <Typography variant="h4">
                                {analytics.totalRedemptions}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent>
                            <Typography color="text.secondary" gutterBottom>
                                Total Discount Given
                            </Typography>
                            <Typography variant="h4">
                                {formatAmount(analytics.totalDiscountGiven)}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Charts */}
                <Grid item xs={12} md={8}>
                    <Typography variant="subtitle1" gutterBottom>
                        Top Performing Promotions
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={topPromotionsData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                            <Tooltip />
                            <Bar yAxisId="left" dataKey="redemptions" fill="#8884d8" name="Redemptions" />
                            <Bar yAxisId="right" dataKey="discount" fill="#82ca9d" name="Discount Amount" />
                        </BarChart>
                    </ResponsiveContainer>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Typography variant="subtitle1" gutterBottom>
                        Promotions by Type
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={typeData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => 
                                    `${name} ${(percent * 100).toFixed(0)}%`
                                }
                            >
                                {typeData.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={COLORS[index % COLORS.length]} 
                                    />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default PromotionAnalytics;
