const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    type: {
        type: String,
        required: true,
        enum: ['WAREHOUSE', 'RETAIL_STORE', 'DISTRIBUTION_CENTER', 'PICKUP_POINT', 'VIRTUAL'],
        default: 'WAREHOUSE'
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'CLOSED'],
        default: 'ACTIVE'
    },
    address: {
        street: String,
        city: String,
        state: String,
        country: String,
        postalCode: String,
        coordinates: {
            latitude: Number,
            longitude: Number
        }
    },
    contact: {
        email: String,
        phone: String,
        manager: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        alternateContact: {
            name: String,
            phone: String,
            email: String
        }
    },
    operatingHours: [{
        day: {
            type: String,
            enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
        },
        open: Boolean,
        openTime: String,
        closeTime: String,
        breakStart: String,
        breakEnd: String
    }],
    capacity: {
        totalSpace: Number, // in square meters
        usedSpace: {
            type: Number,
            default: 0
        },
        maxItems: Number,
        currentItems: {
            type: Number,
            default: 0
        },
        zones: [{
            name: String,
            code: String,
            type: {
                type: String,
                enum: ['GENERAL', 'COLD_STORAGE', 'HAZARDOUS', 'HIGH_VALUE', 'BULK']
            },
            capacity: Number,
            currentUsage: {
                type: Number,
                default: 0
            }
        }]
    },
    features: [{
        type: String,
        enum: [
            'COLD_STORAGE',
            'HAZMAT_CERTIFIED',
            'SECURITY_SYSTEM',
            'LOADING_DOCK',
            'CLIMATE_CONTROL',
            'RACK_STORAGE',
            '24_7_ACCESS'
        ]
    }],
    restrictions: {
        maxItemWeight: Number, // in kg
        maxItemSize: {
            length: Number,
            width: Number,
            height: Number
        },
        restrictedItems: [String],
        specialHandlingRequired: Boolean
    },
    preferences: {
        defaultReceivingDays: [{
            type: String,
            enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
        }],
        preferredCarriers: [String],
        specialInstructions: String
    },
    metrics: {
        utilizationHistory: [{
            date: Date,
            spaceUtilization: Number,
            itemCount: Number
        }],
        throughput: {
            daily: {
                type: Number,
                default: 0
            },
            weekly: {
                type: Number,
                default: 0
            },
            monthly: {
                type: Number,
                default: 0
            }
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
locationSchema.index({ code: 1 });
locationSchema.index({ status: 1 });
locationSchema.index({ type: 1 });
locationSchema.index({ 'address.city': 1, 'address.country': 1 });

// Methods
locationSchema.methods = {
    isOperatingNow() {
        const now = new Date();
        const currentDay = now.toLocaleString('en-US', { weekday: 'uppercase' });
        const currentTime = now.toLocaleTimeString('en-US', { hour12: false });
        
        const todaySchedule = this.operatingHours.find(
            schedule => schedule.day === currentDay && schedule.open
        );
        
        if (!todaySchedule) return false;
        
        return currentTime >= todaySchedule.openTime && 
               currentTime <= todaySchedule.closeTime;
    },

    getUtilization() {
        if (!this.capacity.totalSpace) return 0;
        return (this.capacity.usedSpace / this.capacity.totalSpace) * 100;
    },

    canAcceptStock(spaceNeeded, weight = 0, itemCount = 1) {
        // Check space availability
        const availableSpace = this.capacity.totalSpace - this.capacity.usedSpace;
        if (spaceNeeded > availableSpace) return false;

        // Check item count limits
        if (this.capacity.maxItems && 
            this.capacity.currentItems + itemCount > this.capacity.maxItems) {
            return false;
        }

        // Check weight restrictions
        if (this.restrictions.maxItemWeight && 
            weight > this.restrictions.maxItemWeight) {
            return false;
        }

        return true;
    },

    async updateMetrics() {
        const now = new Date();
        const utilization = this.getUtilization();

        // Update utilization history
        this.metrics.utilizationHistory.push({
            date: now,
            spaceUtilization: utilization,
            itemCount: this.capacity.currentItems
        });

        // Trim history to keep last 30 days
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
        this.metrics.utilizationHistory = this.metrics.utilizationHistory.filter(
            record => record.date >= thirtyDaysAgo
        );

        await this.save();
    },

    async getInventory() {
        return mongoose.model('Product').find({
            'locations.locationId': this._id
        }).populate('category supplier');
    },

    async getLowStockItems() {
        const products = await this.getInventory();
        return products.filter(product => {
            const locationStock = product.getStockByLocation(this._id);
            return locationStock <= product.lowStockThreshold;
        });
    }
};

// Static methods
locationSchema.statics = {
    async findNearby(coordinates, maxDistance = 10000) { // maxDistance in meters
        return this.find({
            'address.coordinates': {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [coordinates.longitude, coordinates.latitude]
                    },
                    $maxDistance: maxDistance
                }
            }
        });
    },

    async getActiveLocations() {
        return this.find({ status: 'ACTIVE' })
            .sort({ name: 1 });
    }
};

// Middleware
locationSchema.pre('save', async function(next) {
    if (!this.code) {
        // Generate location code if not provided
        const locationCount = await this.constructor.countDocuments();
        this.code = `LOC${String(locationCount + 1).padStart(4, '0')}`;
    }

    // Update metrics
    if (this.isModified('capacity.usedSpace') || 
        this.isModified('capacity.currentItems')) {
        await this.updateMetrics();
    }

    next();
});

module.exports = mongoose.model('Location', locationSchema);
