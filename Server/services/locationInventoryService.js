const LocationInventory = require('../models/LocationInventory');
const Location = require('../models/Location');
const Product = require('../models/Product');
const logger = require('../utils/logger');
const emailService = require('../utils/emailService');

class LocationInventoryService {
    async createOrUpdateInventory(locationId, productId, data) {
        try {
            let inventory = await LocationInventory.findOne({ location: locationId, product: productId });
            
            if (!inventory) {
                inventory = new LocationInventory({
                    location: locationId,
                    product: productId,
                    ...data
                });
            } else {
                Object.assign(inventory, data);
            }

            await inventory.save();
            return inventory;
        } catch (error) {
            logger.error('Error in createOrUpdateInventory:', error);
            throw error;
        }
    }

    async getLocationInventory(locationId, filters = {}) {
        try {
            const query = { location: locationId, ...filters };
            const inventory = await LocationInventory.find(query)
                .populate('product')
                .populate('lastStockCheck.user', 'name email');
            
            return inventory;
        } catch (error) {
            logger.error('Error in getLocationInventory:', error);
            throw error;
        }
    }

    async transferStock(fromLocationId, toLocationId, productId, quantity, user, reference = '') {
        try {
            const sourceInventory = await LocationInventory.findOne({ 
                location: fromLocationId, 
                product: productId 
            });
            
            if (!sourceInventory || !sourceInventory.canFulfill(quantity)) {
                throw new Error('Insufficient stock at source location');
            }

            const destinationInventory = await this.createOrUpdateInventory(
                toLocationId,
                productId,
                { quantity: 0 }
            );

            // Start transaction
            const session = await LocationInventory.startSession();
            await session.withTransaction(async () => {
                // Deduct from source
                sourceInventory.quantity -= quantity;
                sourceInventory.addStockMovement(
                    'TRANSFERRED',
                    -quantity,
                    user._id,
                    reference,
                    `Transferred to ${toLocationId}`
                );
                await sourceInventory.save();

                // Add to destination
                destinationInventory.quantity += quantity;
                destinationInventory.addStockMovement(
                    'TRANSFERRED',
                    quantity,
                    user._id,
                    reference,
                    `Transferred from ${fromLocationId}`
                );
                await destinationInventory.save();
            });
            await session.endSession();

            return {
                sourceInventory,
                destinationInventory
            };
        } catch (error) {
            logger.error('Error in transferStock:', error);
            throw error;
        }
    }

    async adjustStock(locationId, productId, quantity, user, reason) {
        try {
            const inventory = await LocationInventory.findOne({
                location: locationId,
                product: productId
            });

            if (!inventory) {
                throw new Error('Inventory not found');
            }

            const oldQuantity = inventory.quantity;
            inventory.quantity = quantity;
            inventory.addStockMovement(
                'ADJUSTED',
                quantity - oldQuantity,
                user._id,
                '',
                reason
            );

            await inventory.save();

            // Check for low stock after adjustment
            if (inventory.isLowStock()) {
                const location = await Location.findById(locationId);
                const product = await Product.findById(productId);
                
                await emailService.sendLowStockAlert(product, location);
            }

            return inventory;
        } catch (error) {
            logger.error('Error in adjustStock:', error);
            throw error;
        }
    }

    async recordStockCheck(locationId, productId, user, notes = '') {
        try {
            const inventory = await LocationInventory.findOne({
                location: locationId,
                product: productId
            });

            if (!inventory) {
                throw new Error('Inventory not found');
            }

            inventory.lastStockCheck = {
                date: new Date(),
                user: user._id,
                notes
            };

            await inventory.save();
            return inventory;
        } catch (error) {
            logger.error('Error in recordStockCheck:', error);
            throw error;
        }
    }

    async getStockMovements(locationId, productId, filters = {}) {
        try {
            const inventory = await LocationInventory.findOne({
                location: locationId,
                product: productId
            });

            if (!inventory) {
                throw new Error('Inventory not found');
            }

            let movements = inventory.stockMovements;

            // Apply filters
            if (filters.startDate) {
                movements = movements.filter(m => m.date >= filters.startDate);
            }
            if (filters.endDate) {
                movements = movements.filter(m => m.date <= filters.endDate);
            }
            if (filters.type) {
                movements = movements.filter(m => m.type === filters.type);
            }

            return movements;
        } catch (error) {
            logger.error('Error in getStockMovements:', error);
            throw error;
        }
    }

    async getLowStockItems(locationId) {
        try {
            const items = await LocationInventory.find({
                location: locationId,
                status: 'LOW_STOCK'
            }).populate('product');

            return items;
        } catch (error) {
            logger.error('Error in getLowStockItems:', error);
            throw error;
        }
    }

    async reserveStock(locationId, productId, quantity, reference) {
        try {
            const inventory = await LocationInventory.findOne({
                location: locationId,
                product: productId
            });

            if (!inventory || !inventory.canFulfill(quantity)) {
                throw new Error('Insufficient stock available');
            }

            inventory.reservedQuantity += quantity;
            await inventory.save();

            return inventory;
        } catch (error) {
            logger.error('Error in reserveStock:', error);
            throw error;
        }
    }

    async releaseReservedStock(locationId, productId, quantity, reference) {
        try {
            const inventory = await LocationInventory.findOne({
                location: locationId,
                product: productId
            });

            if (!inventory) {
                throw new Error('Inventory not found');
            }

            if (inventory.reservedQuantity < quantity) {
                throw new Error('Cannot release more than reserved quantity');
            }

            inventory.reservedQuantity -= quantity;
            await inventory.save();

            return inventory;
        } catch (error) {
            logger.error('Error in releaseReservedStock:', error);
            throw error;
        }
    }

    async getInventoryValueByLocation(locationId) {
        try {
            const inventory = await LocationInventory.find({ location: locationId })
                .populate('product', 'price');

            const totalValue = inventory.reduce((sum, item) => {
                return sum + (item.quantity * item.product.price);
            }, 0);

            return {
                locationId,
                totalItems: inventory.length,
                totalQuantity: inventory.reduce((sum, item) => sum + item.quantity, 0),
                totalValue
            };
        } catch (error) {
            logger.error('Error in getInventoryValueByLocation:', error);
            throw error;
        }
    }
}

module.exports = new LocationInventoryService();
