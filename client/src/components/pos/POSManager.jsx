import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Button,
    Box,
    Card,
    CardContent,
} from '@mui/material';
import {
    PointOfSale as PointOfSaleIcon,
    Receipt as ReceiptIcon,
    LocalAtm as LocalAtmIcon,
    History as HistoryIcon,
    LocalOffer as LocalOfferIcon,
} from '@mui/icons-material';

const POSManager = () => {
    const navigate = useNavigate();

    const menuItems = [
        {
            title: 'Sales Terminal',
            description: 'Process new sales and transactions',
            icon: <PointOfSaleIcon sx={{ fontSize: 40 }} />,
            path: '/pos/sales-terminal',
            color: 'primary.main',
        },
        {
            title: 'Receipts',
            description: 'View and manage receipts',
            icon: <ReceiptIcon sx={{ fontSize: 40 }} />,
            path: '/pos/receipts',
            color: 'secondary.main',
        },
        {
            title: 'Sales History',
            description: 'View past sales and transactions',
            icon: <HistoryIcon sx={{ fontSize: 40 }} />,
            path: '/sales/history',
            color: 'success.main',
        },
        {
            title: 'Cash Management',
            description: 'Manage cash drawer and reconciliation',
            icon: <LocalAtmIcon sx={{ fontSize: 40 }} />,
            path: '/pos/cash',
            color: 'warning.main',
        },
    ];

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                Point of Sale
            </Typography>
            <Grid container spacing={3}>
                {menuItems.map((item) => (
                    <Grid item xs={12} sm={6} md={3} key={item.title}>
                        <Paper
                            sx={{
                                p: 3,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                '&:hover': {
                                    transform: 'scale(1.02)',
                                },
                                height: '100%',
                            }}
                            onClick={() => navigate(item.path)}
                        >
                            <Box
                                sx={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: `${item.color}15`,
                                    color: item.color,
                                    mb: 2,
                                }}
                            >
                                {item.icon}
                            </Box>
                            <Typography variant="h6" align="center" gutterBottom>
                                {item.title}
                            </Typography>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                align="center"
                            >
                                {item.description}
                            </Typography>
                        </Paper>
                    </Grid>
                ))}
                <Grid item xs={12} sm={6} md={3}>
                    <Card
                        sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            cursor: 'pointer',
                        }}
                        onClick={() => navigate('/pos/promotions')}
                    >
                        <CardContent sx={{ flexGrow: 1 }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    mb: 2,
                                }}
                            >
                                <LocalOfferIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                            </Box>
                            <Typography gutterBottom variant="h5" component="h2" align="center">
                                Promotions
                            </Typography>
                            <Typography align="center" color="text.secondary">
                                Manage discounts, deals, and special offers to boost sales
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
};

export default POSManager;
