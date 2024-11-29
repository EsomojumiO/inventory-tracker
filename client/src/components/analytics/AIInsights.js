import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    LinearProgress,
    Chip,
    Button,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    Timeline,
    TimelineItem,
    TimelineSeparator,
    TimelineConnector,
    TimelineContent,
    TimelineDot,
} from '@mui/lab';
import {
    TrendingUp,
    TrendingDown,
    Info,
    Refresh,
    ShoppingCart,
    Assessment,
    ShowChart,
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import api from '../../services/api';

const AIInsights = () => {
    const [loading, setLoading] = useState(true);
    const [salesForecast, setSalesForecast] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [demandPredictions, setDemandPredictions] = useState([]);
    const [selectedTimeframe, setSelectedTimeframe] = useState('30days');

    useEffect(() => {
        loadInsights();
    }, [selectedTimeframe]);

    const loadInsights = async () => {
        setLoading(true);
        try {
            const [forecastRes, recommendationsRes, demandRes] = await Promise.all([
                api.get('/api/ai/sales-forecast', { params: { timeframe: selectedTimeframe } }),
                api.get('/api/ai/recommendations'),
                api.get('/api/ai/demand-predictions')
            ]);

            setSalesForecast(forecastRes.data);
            setRecommendations(recommendationsRes.data);
            setDemandPredictions(demandRes.data);
        } catch (error) {
            console.error('Error loading AI insights:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderSalesForecast = () => {
        const data = {
            labels: salesForecast.map(f => f.date),
            datasets: [
                {
                    label: 'Predicted Sales',
                    data: salesForecast.map(f => f.predictedSales),
                    fill: false,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }
            ]
        };

        const options = {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Sales Forecast'
                }
            }
        };

        return (
            <Card>
                <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">Sales Forecast</Typography>
                        <Box>
                            <Button
                                size="small"
                                onClick={() => setSelectedTimeframe('30days')}
                                variant={selectedTimeframe === '30days' ? 'contained' : 'outlined'}
                                sx={{ mr: 1 }}
                            >
                                30 Days
                            </Button>
                            <Button
                                size="small"
                                onClick={() => setSelectedTimeframe('90days')}
                                variant={selectedTimeframe === '90days' ? 'contained' : 'outlined'}
                            >
                                90 Days
                            </Button>
                        </Box>
                    </Box>
                    <Line data={data} options={options} />
                </CardContent>
            </Card>
        );
    };

    const renderRecommendations = () => (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Product Recommendations
                </Typography>
                <Timeline>
                    {recommendations.map((rec, index) => (
                        <TimelineItem key={index}>
                            <TimelineSeparator>
                                <TimelineDot color={rec.score > 0.8 ? 'success' : 'primary'}>
                                    <ShoppingCart />
                                </TimelineDot>
                                {index < recommendations.length - 1 && <TimelineConnector />}
                            </TimelineSeparator>
                            <TimelineContent>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body1">{rec.product.name}</Typography>
                                    <Chip
                                        label={`${Math.round(rec.score * 100)}% Match`}
                                        size="small"
                                        color={rec.score > 0.8 ? 'success' : 'primary'}
                                    />
                                </Box>
                                <Typography variant="body2" color="textSecondary">
                                    {rec.reason}
                                </Typography>
                            </TimelineContent>
                        </TimelineItem>
                    ))}
                </Timeline>
            </CardContent>
        </Card>
    );

    const renderDemandPredictions = () => (
        <Card>
            <CardContent>
                <Typography variant="h6" gutterBottom>
                    Demand Predictions
                </Typography>
                <Grid container spacing={2}>
                    {demandPredictions.map((prediction, index) => (
                        <Grid item xs={12} key={index}>
                            <Box
                                p={2}
                                bgcolor={prediction.trend === 'up' ? '#e8f5e9' : '#ffebee'}
                                borderRadius={1}
                            >
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="subtitle1">
                                        {prediction.product.name}
                                    </Typography>
                                    <Box display="flex" alignItems="center">
                                        {prediction.trend === 'up' ? (
                                            <TrendingUp color="success" />
                                        ) : (
                                            <TrendingDown color="error" />
                                        )}
                                        <Typography
                                            variant="body2"
                                            color={prediction.trend === 'up' ? 'success' : 'error'}
                                            ml={1}
                                        >
                                            {prediction.percentage}%
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box mt={1}>
                                    <Typography variant="body2" color="textSecondary">
                                        Predicted demand: {prediction.predictedDemand} units
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={prediction.confidence}
                                        sx={{ mt: 1 }}
                                    />
                                    <Typography variant="caption" color="textSecondary">
                                        Confidence: {prediction.confidence}%
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </CardContent>
        </Card>
    );

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box p={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5">AI Insights</Typography>
                <Box>
                    <Tooltip title="Refresh insights">
                        <IconButton onClick={loadInsights} size="small">
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="About AI insights">
                        <IconButton size="small">
                            <Info />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                    {renderSalesForecast()}
                </Grid>
                <Grid item xs={12} md={4}>
                    {renderRecommendations()}
                </Grid>
                <Grid item xs={12}>
                    {renderDemandPredictions()}
                </Grid>
            </Grid>
        </Box>
    );
};

export default AIInsights;
