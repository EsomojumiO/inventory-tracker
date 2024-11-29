import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Box,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import dayjs from 'dayjs';
import { PROMOTION_TYPES } from '../../../context/PromotionsContext';

const PromotionForm = ({ open, onClose, onSubmit, promotion }) => {
    const [formData, setFormData] = useState({
        name: '',
        type: PROMOTION_TYPES.PERCENTAGE,
        value: '',
        startDate: dayjs(),
        endDate: dayjs().add(7, 'day'),
        promoCode: '',
        maxRedemptions: '',
        productCategories: [],
        threshold: '',
        description: '',
        customerSegments: [],
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (promotion) {
            setFormData({
                ...promotion,
                startDate: dayjs(promotion.startDate),
                endDate: dayjs(promotion.endDate),
            });
        }
    }, [promotion]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
        // Clear error when field is modified
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleDateChange = (name) => (newValue) => {
        setFormData(prev => ({
            ...prev,
            [name]: newValue,
        }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.value && formData.type !== PROMOTION_TYPES.FREE_GIFT) {
            newErrors.value = 'Value is required';
        }

        if (formData.type === PROMOTION_TYPES.THRESHOLD && !formData.threshold) {
            newErrors.threshold = 'Threshold amount is required';
        }

        if (formData.endDate.isBefore(formData.startDate)) {
            newErrors.endDate = 'End date must be after start date';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (validateForm()) {
            const submissionData = {
                ...formData,
                startDate: formData.startDate.toISOString(),
                endDate: formData.endDate.toISOString(),
            };
            onSubmit(submissionData);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                {promotion ? 'Edit Promotion' : 'Create New Promotion'}
            </DialogTitle>
            <DialogContent>
                <Box component="form" noValidate sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                name="name"
                                label="Promotion Name"
                                fullWidth
                                value={formData.name}
                                onChange={handleChange}
                                error={!!errors.name}
                                helperText={errors.name}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Promotion Type</InputLabel>
                                <Select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    label="Promotion Type"
                                >
                                    <MenuItem value={PROMOTION_TYPES.PERCENTAGE}>Percentage Off</MenuItem>
                                    <MenuItem value={PROMOTION_TYPES.FIXED_AMOUNT}>Fixed Amount Off</MenuItem>
                                    <MenuItem value={PROMOTION_TYPES.BOGO}>Buy One Get One</MenuItem>
                                    <MenuItem value={PROMOTION_TYPES.FREE_GIFT}>Free Gift</MenuItem>
                                    <MenuItem value={PROMOTION_TYPES.THRESHOLD}>Threshold Discount</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                name="value"
                                label={formData.type === PROMOTION_TYPES.PERCENTAGE ? 'Percentage' : 'Amount'}
                                type="number"
                                fullWidth
                                value={formData.value}
                                onChange={handleChange}
                                error={!!errors.value}
                                helperText={errors.value}
                                InputProps={{
                                    startAdornment: formData.type === PROMOTION_TYPES.PERCENTAGE ? '%' : '₦',
                                }}
                            />
                        </Grid>

                        {formData.type === PROMOTION_TYPES.THRESHOLD && (
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    name="threshold"
                                    label="Minimum Purchase Amount"
                                    type="number"
                                    fullWidth
                                    value={formData.threshold}
                                    onChange={handleChange}
                                    error={!!errors.threshold}
                                    helperText={errors.threshold}
                                    InputProps={{
                                        startAdornment: '₦',
                                    }}
                                />
                            </Grid>
                        )}

                        <Grid item xs={12} sm={6}>
                            <DateTimePicker
                                label="Start Date"
                                value={formData.startDate}
                                onChange={handleDateChange('startDate')}
                                renderInput={(params) => <TextField {...params} fullWidth />}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                    },
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <DateTimePicker
                                label="End Date"
                                value={formData.endDate}
                                onChange={handleDateChange('endDate')}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        error: !!errors.endDate,
                                        helperText: errors.endDate,
                                    },
                                }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                name="promoCode"
                                label="Promotion Code (Optional)"
                                fullWidth
                                value={formData.promoCode}
                                onChange={handleChange}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                name="maxRedemptions"
                                label="Maximum Redemptions (Optional)"
                                type="number"
                                fullWidth
                                value={formData.maxRedemptions}
                                onChange={handleChange}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                name="description"
                                label="Description"
                                multiline
                                rows={4}
                                fullWidth
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSubmit} variant="contained" color="primary">
                    {promotion ? 'Update' : 'Create'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PromotionForm;
