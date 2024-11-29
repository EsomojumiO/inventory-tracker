import React, { useState } from 'react';
import {
    Paper,
    Typography,
    FormGroup,
    FormControlLabel,
    Switch,
    Button,
    Box,
    CircularProgress,
    Divider
} from '@mui/material';
import { useNotification } from '../../context/NotificationContext';

const NotificationSettings = () => {
    const { showSuccess, showError } = useNotification();
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({
        emailNotifications: true,
        lowStockAlerts: true,
        orderUpdates: true,
        salesReports: true,
        securityAlerts: true,
        systemUpdates: false
    });

    const handleChange = (event) => {
        setSettings({
            ...settings,
            [event.target.name]: event.target.checked
        });
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Add API call to save notification settings here
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call
            showSuccess('Notification settings updated successfully');
        } catch (error) {
            showError('Failed to update notification settings');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Notification Settings
            </Typography>

            <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                    Email Notifications
                </Typography>
                <FormGroup>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings.emailNotifications}
                                onChange={handleChange}
                                name="emailNotifications"
                            />
                        }
                        label="Enable email notifications"
                    />
                </FormGroup>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle1" gutterBottom>
                    Inventory Alerts
                </Typography>
                <FormGroup>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings.lowStockAlerts}
                                onChange={handleChange}
                                name="lowStockAlerts"
                            />
                        }
                        label="Low stock alerts"
                    />
                </FormGroup>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle1" gutterBottom>
                    Order & Sales
                </Typography>
                <FormGroup>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings.orderUpdates}
                                onChange={handleChange}
                                name="orderUpdates"
                            />
                        }
                        label="Order status updates"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings.salesReports}
                                onChange={handleChange}
                                name="salesReports"
                            />
                        }
                        label="Daily sales reports"
                    />
                </FormGroup>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle1" gutterBottom>
                    System
                </Typography>
                <FormGroup>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings.securityAlerts}
                                onChange={handleChange}
                                name="securityAlerts"
                            />
                        }
                        label="Security alerts"
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={settings.systemUpdates}
                                onChange={handleChange}
                                name="systemUpdates"
                            />
                        }
                        label="System updates"
                    />
                </FormGroup>
            </Box>

            <Box sx={{ mt: 3 }}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSave}
                    disabled={loading}
                >
                    {loading ? <CircularProgress size={24} /> : 'Save Changes'}
                </Button>
            </Box>
        </Paper>
    );
};

export default NotificationSettings;
