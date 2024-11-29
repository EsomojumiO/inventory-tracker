import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Chip,
    Typography,
    Box,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { usePromotions, PROMOTION_TYPES } from '../../../context/PromotionsContext';

const PromotionsList = ({ promotions, onEdit, onDelete, getStatusColor }) => {
    const { getPromotionStatus, formatAmount } = usePromotions();

    const getPromotionTypeLabel = (type) => {
        switch (type) {
            case PROMOTION_TYPES.PERCENTAGE:
                return 'Percentage Off';
            case PROMOTION_TYPES.FIXED_AMOUNT:
                return 'Fixed Amount';
            case PROMOTION_TYPES.BOGO:
                return 'Buy One Get One';
            case PROMOTION_TYPES.FREE_GIFT:
                return 'Free Gift';
            case PROMOTION_TYPES.THRESHOLD:
                return 'Threshold Discount';
            default:
                return type;
        }
    };

    const formatValue = (promotion) => {
        switch (promotion.type) {
            case PROMOTION_TYPES.PERCENTAGE:
                return `${promotion.value}%`;
            case PROMOTION_TYPES.FIXED_AMOUNT:
                return formatAmount(promotion.value);
            case PROMOTION_TYPES.BOGO:
                return 'Buy 1 Get 1 Free';
            case PROMOTION_TYPES.FREE_GIFT:
                return 'Free Gift';
            case PROMOTION_TYPES.THRESHOLD:
                return `${formatAmount(promotion.value)} off above ${formatAmount(promotion.threshold)}`;
            default:
                return promotion.value;
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (!promotions.length) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                    No promotions found
                </Typography>
            </Box>
        );
    }

    return (
        <TableContainer component={Paper} elevation={0}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Value</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Valid Period</TableCell>
                        <TableCell>Usage</TableCell>
                        <TableCell>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {promotions.map((promotion) => {
                        const status = getPromotionStatus(promotion);
                        return (
                            <TableRow key={promotion.id}>
                                <TableCell>
                                    <Typography variant="body1">{promotion.name}</Typography>
                                    {promotion.promoCode && (
                                        <Typography variant="caption" color="text.secondary">
                                            Code: {promotion.promoCode}
                                        </Typography>
                                    )}
                                </TableCell>
                                <TableCell>{getPromotionTypeLabel(promotion.type)}</TableCell>
                                <TableCell>{formatValue(promotion)}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={status}
                                        color={getStatusColor(status)}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {formatDate(promotion.startDate)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        to {formatDate(promotion.endDate)}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    <Typography variant="body2">
                                        {promotion.redemptionCount} uses
                                    </Typography>
                                    {promotion.maxRedemptions && (
                                        <Typography variant="caption" color="text.secondary">
                                            of {promotion.maxRedemptions}
                                        </Typography>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <IconButton
                                        size="small"
                                        onClick={() => onEdit(promotion)}
                                        color="primary"
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => onDelete(promotion.id)}
                                        color="error"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default PromotionsList;
