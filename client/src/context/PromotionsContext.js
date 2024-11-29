import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCurrency } from './CurrencyContext';

const PromotionsContext = createContext();

export const PROMOTION_TYPES = {
    PERCENTAGE: 'PERCENTAGE',
    FIXED_AMOUNT: 'FIXED_AMOUNT',
    BOGO: 'BOGO',
    FREE_GIFT: 'FREE_GIFT',
    THRESHOLD: 'THRESHOLD',
};

export const PROMOTION_STATUS = {
    ACTIVE: 'ACTIVE',
    UPCOMING: 'UPCOMING',
    EXPIRED: 'EXPIRED',
    DISABLED: 'DISABLED',
};

export const usePromotions = () => {
    const context = useContext(PromotionsContext);
    if (!context) {
        throw new Error('usePromotions must be used within a PromotionsProvider');
    }
    return context;
};

export const PromotionsProvider = ({ children }) => {
    const { user } = useAuth();
    const { formatAmount } = useCurrency();
    const [promotions, setPromotions] = useState([]);

    const createPromotion = useCallback((promotionData) => {
        const newPromotion = {
            ...promotionData,
            id: Date.now().toString(),
            createdBy: user.id,
            createdAt: new Date().toISOString(),
            redemptionCount: 0,
            totalDiscountGiven: 0,
        };

        setPromotions(prev => [...prev, newPromotion]);
        return newPromotion;
    }, [user]);

    const updatePromotion = useCallback((id, updates) => {
        setPromotions(prev =>
            prev.map(promo =>
                promo.id === id ? { ...promo, ...updates } : promo
            )
        );
    }, []);

    const deletePromotion = useCallback((id) => {
        setPromotions(prev => prev.filter(promo => promo.id !== id));
    }, []);

    const getPromotionStatus = useCallback((promotion) => {
        const now = new Date();
        const startDate = new Date(promotion.startDate);
        const endDate = new Date(promotion.endDate);

        if (promotion.disabled) return PROMOTION_STATUS.DISABLED;
        if (now < startDate) return PROMOTION_STATUS.UPCOMING;
        if (now > endDate) return PROMOTION_STATUS.EXPIRED;
        return PROMOTION_STATUS.ACTIVE;
    }, []);

    const getActivePromotions = useCallback(() => {
        return promotions.filter(promo => getPromotionStatus(promo) === PROMOTION_STATUS.ACTIVE);
    }, [promotions, getPromotionStatus]);

    const calculateDiscount = useCallback((promotion, subtotal, items) => {
        switch (promotion.type) {
            case PROMOTION_TYPES.PERCENTAGE:
                return (subtotal * promotion.value) / 100;
            
            case PROMOTION_TYPES.FIXED_AMOUNT:
                return promotion.value;
            
            case PROMOTION_TYPES.BOGO:
                // Find eligible items and calculate BOGO discount
                const eligibleItems = items.filter(item => 
                    promotion.productCategories.includes(item.category)
                );
                const freeItems = Math.floor(eligibleItems.length / 2);
                return eligibleItems
                    .sort((a, b) => a.price - b.price)
                    .slice(0, freeItems)
                    .reduce((sum, item) => sum + item.price, 0);
            
            case PROMOTION_TYPES.THRESHOLD:
                return subtotal >= promotion.threshold ? 
                    (promotion.discountType === 'percentage' ? 
                        (subtotal * promotion.value) / 100 : 
                        promotion.value) : 0;
            
            default:
                return 0;
        }
    }, []);

    const validatePromoCode = useCallback((code, customer) => {
        const promotion = promotions.find(p => p.promoCode === code);
        if (!promotion) return { valid: false, message: 'Invalid promotion code' };

        const status = getPromotionStatus(promotion);
        if (status !== PROMOTION_STATUS.ACTIVE) {
            return { valid: false, message: `Promotion is ${status.toLowerCase()}` };
        }

        if (promotion.maxRedemptions && 
            promotion.redemptionCount >= promotion.maxRedemptions) {
            return { valid: false, message: 'Promotion limit reached' };
        }

        if (promotion.customerSegments && 
            !promotion.customerSegments.includes(customer.segment)) {
            return { valid: false, message: 'Not eligible for this promotion' };
        }

        return { valid: true, promotion };
    }, [promotions, getPromotionStatus]);

    const recordRedemption = useCallback((promotionId, discountAmount) => {
        setPromotions(prev =>
            prev.map(promo =>
                promo.id === promotionId ? {
                    ...promo,
                    redemptionCount: promo.redemptionCount + 1,
                    totalDiscountGiven: promo.totalDiscountGiven + discountAmount,
                } : promo
            )
        );
    }, []);

    const getPromotionAnalytics = useCallback((startDate, endDate) => {
        const filteredPromotions = promotions.filter(promo => {
            const promoStart = new Date(promo.createdAt);
            return promoStart >= startDate && promoStart <= endDate;
        });

        return {
            totalPromotions: filteredPromotions.length,
            totalRedemptions: filteredPromotions.reduce((sum, p) => sum + p.redemptionCount, 0),
            totalDiscountGiven: filteredPromotions.reduce((sum, p) => sum + p.totalDiscountGiven, 0),
            promotionsByType: Object.values(PROMOTION_TYPES).reduce((acc, type) => ({
                ...acc,
                [type]: filteredPromotions.filter(p => p.type === type).length
            }), {}),
            topPromotions: [...filteredPromotions]
                .sort((a, b) => b.redemptionCount - a.redemptionCount)
                .slice(0, 5),
        };
    }, [promotions]);

    const value = {
        promotions,
        createPromotion,
        updatePromotion,
        deletePromotion,
        getPromotionStatus,
        getActivePromotions,
        calculateDiscount,
        validatePromoCode,
        recordRedemption,
        getPromotionAnalytics,
        formatAmount,
    };

    return (
        <PromotionsContext.Provider value={value}>
            {children}
        </PromotionsContext.Provider>
    );
};
