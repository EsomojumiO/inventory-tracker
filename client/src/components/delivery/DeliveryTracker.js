import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Stepper,
    Step,
    StepLabel,
    CircularProgress,
    Alert,
    Grid,
    Paper
} from '@mui/material';
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot } from '@mui/lab';
import { LocalShipping, LocationOn, CheckCircle, Error } from '@mui/icons-material';

const DeliveryTracker = ({ trackingNumber, provider }) => {
    const [trackingInfo, setTrackingInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { t } = useTranslation();

    useEffect(() => {
        const fetchTrackingInfo = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`/api/delivery/track/${provider}/${trackingNumber}`);
                setTrackingInfo(response.data);
                setError(null);
            } catch (err) {
                setError(t('delivery.tracking.error'));
                console.error('Error fetching tracking info:', err);
            } finally {
                setLoading(false);
            }
        };

        if (trackingNumber && provider) {
            fetchTrackingInfo();
            // Refresh tracking info every 5 minutes
            const interval = setInterval(fetchTrackingInfo, 300000);
            return () => clearInterval(interval);
        }
    }, [trackingNumber, provider, t]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    if (!trackingInfo) {
        return <Alert severity="info">{t('delivery.tracking.noInfo')}</Alert>;
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case 'IN_TRANSIT':
                return <LocalShipping color="primary" />;
            case 'DELIVERED':
                return <CheckCircle color="success" />;
            case 'EXCEPTION':
                return <Error color="error" />;
            default:
                return <LocationOn color="action" />;
        }
    };

    return (
        <Card>
            <CardContent>
                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <Typography variant="h6" gutterBottom>
                            {t('delivery.tracking.title')}
                        </Typography>
                        <Typography color="textSecondary" gutterBottom>
                            {t('delivery.tracking.number')}: {trackingNumber}
                        </Typography>
                    </Grid>

                    <Grid item xs={12}>
                        <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
                            <Stepper activeStep={getDeliveryStep(trackingInfo.status)} alternativeLabel>
                                <Step>
                                    <StepLabel>{t('delivery.status.shipped')}</StepLabel>
                                </Step>
                                <Step>
                                    <StepLabel>{t('delivery.status.inTransit')}</StepLabel>
                                </Step>
                                <Step>
                                    <StepLabel>{t('delivery.status.outForDelivery')}</StepLabel>
                                </Step>
                                <Step>
                                    <StepLabel>{t('delivery.status.delivered')}</StepLabel>
                                </Step>
                            </Stepper>
                        </Paper>
                    </Grid>

                    <Grid item xs={12}>
                        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                            <Timeline>
                                {trackingInfo.events.map((event, index) => (
                                    <TimelineItem key={index}>
                                        <TimelineSeparator>
                                            <TimelineDot color={getTimelineDotColor(event.status)}>
                                                {getStatusIcon(event.status)}
                                            </TimelineDot>
                                            {index < trackingInfo.events.length - 1 && <TimelineConnector />}
                                        </TimelineSeparator>
                                        <TimelineContent>
                                            <Typography variant="body2" color="textSecondary">
                                                {new Date(event.timestamp).toLocaleString()}
                                            </Typography>
                                            <Typography>{event.description}</Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                {event.location}
                                            </Typography>
                                        </TimelineContent>
                                    </TimelineItem>
                                ))}
                            </Timeline>
                        </Box>
                    </Grid>

                    {trackingInfo.estimatedDelivery && (
                        <Grid item xs={12}>
                            <Typography variant="body2" color="textSecondary">
                                {t('delivery.estimatedDelivery')}:{' '}
                                {new Date(trackingInfo.estimatedDelivery).toLocaleDateString()}
                            </Typography>
                        </Grid>
                    )}
                </Grid>
            </CardContent>
        </Card>
    );
};

const getDeliveryStep = (status) => {
    switch (status) {
        case 'SHIPPED':
            return 0;
        case 'IN_TRANSIT':
            return 1;
        case 'OUT_FOR_DELIVERY':
            return 2;
        case 'DELIVERED':
            return 3;
        default:
            return 0;
    }
};

const getTimelineDotColor = (status) => {
    switch (status) {
        case 'IN_TRANSIT':
            return 'primary';
        case 'DELIVERED':
            return 'success';
        case 'EXCEPTION':
            return 'error';
        default:
            return 'grey';
    }
};

export default DeliveryTracker;
