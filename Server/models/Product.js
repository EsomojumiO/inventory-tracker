const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const productSchema = new mongoose.Schema({
  sku: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  qrCode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  brand: {
    type: String,
    trim: true,
    index: true
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0
  },
  physicalStock: {
    type: Number,
    default: 0,
    min: 0
  },
  onlineStock: {
    type: Number,
    default: 0,
    min: 0
  },
  totalStock: {
    type: Number,
    default: 0,
    min: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 10,
    min: 0
  },
  reorderLevel: {
    type: Number,
    default: 20,
    min: 0
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
    index: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    index: true
  },
  locations: [{
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location'
    },
    quantity: {
      type: Number,
      default: 0,
      min: 0
    }
  }],
  batches: [{
    batchNumber: String,
    quantity: Number,
    manufacturingDate: Date,
    expiryDate: Date,
    cost: Number
  }],
  taxRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  discounts: [{
    name: String,
    type: {
      type: String,
      enum: ['PERCENTAGE', 'FIXED'],
      default: 'PERCENTAGE'
    },
    value: Number,
    startDate: Date,
    endDate: Date,
    active: {
      type: Boolean,
      default: true
    }
  }],
  bundleItems: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    quantity: Number
  }],
  isBundle: {
    type: Boolean,
    default: false
  },
  lastRestocked: {
    type: Date
  },
  stockHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['IN', 'OUT', 'TRANSFER', 'ADJUSTMENT', 'BUNDLE'],
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    batchNumber: String,
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location'
    },
    fromLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location'
    },
    toLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location'
    },
    cost: Number,
    note: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  images: [{
    url: String,
    isPrimary: Boolean
  }],
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ barcode: 1 });
productSchema.index({ qrCode: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ 'batches.batchNumber': 1 });
productSchema.index({ 'batches.expiryDate': 1 });

// Auto-increment product number for SKU generation
productSchema.plugin(AutoIncrement, {
  inc_field: 'productNumber',
  start_seq: 1000
});

// Pre-save middleware
productSchema.pre('save', async function(next) {
  try {
    // Generate SKU if not exists
    if (!this.sku) {
      const category = await mongoose.model('Category').findById(this.category);
      const categoryCode = category ? category.code.toUpperCase() : 'GEN';
      const brandCode = this.brand ? this.brand.substring(0, 3).toUpperCase() : 'NOB';
      this.sku = `${categoryCode}-${brandCode}-${this.productNumber}`;
    }

    // Update total stock
    this.totalStock = (this.physicalStock || 0) + (this.onlineStock || 0);

    next();
  } catch (error) {
    next(error);
  }
});

// Methods
productSchema.methods = {
  isLowStock() {
    return this.totalStock <= this.lowStockThreshold;
  },

  needsReorder() {
    return this.totalStock <= this.reorderLevel;
  },

  async addStockHistory(type, quantity, location, options = {}) {
    const historyEntry = {
      type,
      quantity,
      location: location._id || location,
      ...options
    };
    
    this.stockHistory.push(historyEntry);
    await this.save();
    return historyEntry;
  },

  getStockByLocation(locationId) {
    const locationStock = this.locations.find(loc => 
      loc.locationId.toString() === locationId.toString()
    );
    return locationStock ? locationStock.quantity : 0;
  },

  async transferStock(fromLocation, toLocation, quantity, options = {}) {
    const fromLocationStock = this.getStockByLocation(fromLocation);
    if (fromLocationStock < quantity) {
      throw new Error('Insufficient stock at source location');
    }

    // Update location quantities
    this.locations = this.locations.map(loc => {
      if (loc.locationId.toString() === fromLocation.toString()) {
        loc.quantity -= quantity;
      }
      if (loc.locationId.toString() === toLocation.toString()) {
        loc.quantity = (loc.quantity || 0) + quantity;
      }
      return loc;
    });

    // Add transfer history
    await this.addStockHistory('TRANSFER', quantity, toLocation, {
      fromLocation,
      toLocation,
      ...options
    });

    return this.save();
  },

  getActiveBatches() {
    const now = new Date();
    return this.batches.filter(batch => 
      batch.quantity > 0 && (!batch.expiryDate || batch.expiryDate > now)
    );
  },

  getExpiringBatches(days = 30) {
    const now = new Date();
    const futureDate = new Date(now.setDate(now.getDate() + days));
    return this.batches.filter(batch => 
      batch.quantity > 0 && 
      batch.expiryDate && 
      batch.expiryDate <= futureDate
    );
  }
};

// Static methods
productSchema.statics = {
  async findLowStock() {
    return this.find({
      $where: function() {
        return this.totalStock <= this.lowStockThreshold;
      }
    }).populate('category supplier');
  },

  async findNeedsReorder() {
    return this.find({
      $where: function() {
        return this.totalStock <= this.reorderLevel;
      }
    }).populate('category supplier');
  },

  async searchProducts(query, options = {}) {
    const searchOptions = {
      sort: { createdAt: -1 },
      limit: 20,
      ...options
    };

    return this.find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' } }
    )
    .sort({ score: { $meta: 'textScore' } })
    .limit(searchOptions.limit)
    .populate('category supplier');
  }
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
