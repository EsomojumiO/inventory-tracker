import React, { useState } from 'react';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Button,
    Box,
    Tabs,
    Tab,
    IconButton,
    Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { usePromotions, PROMOTION_STATUS, PROMOTION_TYPES } from '../../../context/PromotionsContext';
import PromotionForm from './PromotionForm';
import PromotionsList from './PromotionsList';
import PromotionAnalytics from './PromotionAnalytics';

const PromotionsManager = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedPromotion, setSelectedPromotion] = useState(null);
    const {
        promotions,
        createPromotion,
        updatePromotion,
        deletePromotion,
        getPromotionStatus,
    } = usePromotions();

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const handleCreatePromotion = () => {
        setSelectedPromotion(null);
        setIsFormOpen(true);
    };

    const handleEditPromotion = (promotion) => {
        setSelectedPromotion(promotion);
        setIsFormOpen(true);
    };

    const handleDeletePromotion = (promotionId) => {
        if (window.confirm('Are you sure you want to delete this promotion?')) {
            deletePromotion(promotionId);
        }
    };

    const handleFormSubmit = (promotionData) => {
        if (selectedPromotion) {
            updatePromotion(selectedPromotion.id, promotionData);
        } else {
            createPromotion(promotionData);
        }
        setIsFormOpen(false);
        setSelectedPromotion(null);
    };

    const handleFormClose = () => {
        setIsFormOpen(false);
        setSelectedPromotion(null);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case PROMOTION_STATUS.ACTIVE:
                return 'success';
            case PROMOTION_STATUS.UPCOMING:
                return 'info';
            case PROMOTION_STATUS.EXPIRED:
                return 'error';
            default:
                return 'default';
        }
    };

    const filterPromotions = () => {
        switch (activeTab) {
            case 0: // All
                return promotions;
            case 1: // Active
                return promotions.filter(p => getPromotionStatus(p) === PROMOTION_STATUS.ACTIVE);
            case 2: // Upcoming
                return promotions.filter(p => getPromotionStatus(p) === PROMOTION_STATUS.UPCOMING);
            case 3: // Expired
                return promotions.filter(p => getPromotionStatus(p) === PROMOTION_STATUS.EXPIRED);
            default:
                return promotions;
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Paper
                        sx={{
                            p: 2,
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography component="h1" variant="h6" color="primary">
                                Promotions Management
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={handleCreatePromotion}
                            >
                                Create Promotion
                            </Button>
                        </Box>

                        <Tabs
                            value={activeTab}
                            onChange={handleTabChange}
                            indicatorColor="primary"
                            textColor="primary"
                            sx={{ mb: 2 }}
                        >
                            <Tab label="All Promotions" />
                            <Tab label="Active" />
                            <Tab label="Upcoming" />
                            <Tab label="Expired" />
                        </Tabs>

                        <PromotionsList
                            promotions={filterPromotions()}
                            onEdit={handleEditPromotion}
                            onDelete={handleDeletePromotion}
                            getStatusColor={getStatusColor}
                        />
                    </Paper>
                </Grid>

                <Grid item xs={12}>
                    <PromotionAnalytics />
                </Grid>
            </Grid>

            <PromotionForm
                open={isFormOpen}
                onClose={handleFormClose}
                onSubmit={handleFormSubmit}
                promotion={selectedPromotion}
            />
        </Container>
    );
};

export default PromotionsManager;
