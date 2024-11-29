const mongoose = require('mongoose');

const productListingSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  marketplace: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MarketplaceIntegration',
    required: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'PENDING', 'ERROR', 'OUT_OF_STOCK'],
    default: 'PENDING'
  },
  marketplaceData: {
    listingId: String,
    url: String,
    categoryId: String,
    condition: {
      type: String,
      enum: ['NEW', 'USED', 'REFURBISHED'],
      default: 'NEW'
    }
  },
  pricing: {
    price: {
      type: Number,
      required: true,
      get: v => Math.round(v * 100) / 100, // Round to 2 decimal places
      set: v => Math.round(v * 100) / 100
    },
    compareAtPrice: {
      type: Number,
      get: v => Math.round(v * 100) / 100, // Round to 2 decimal places
      set: v => Math.round(v * 100) / 100
    },
    currency: {
      type: String,
      default: 'NGN',
      enum: ['NGN']
    },
    autoPrice: {
      enabled: {
        type: Boolean,
        default: false
      },
      minPrice: {
        type: Number,
        get: v => Math.round(v * 100) / 100, // Round to 2 decimal places
        set: v => Math.round(v * 100) / 100
      },
      maxPrice: {
        type: Number,
        get: v => Math.round(v * 100) / 100, // Round to 2 decimal places
        set: v => Math.round(v * 100) / 100
      },
      rules: [{
        type: {
          type: String,
          enum: ['FIXED', 'PERCENTAGE', 'FORMULA']
        },
        value: mongoose.Schema.Types.Mixed
      }]
    }
  },
  inventory: {
    sku: String,
    quantity: {
      type: Number,
      default: 0
    },
    reserved: {
      type: Number,
      default: 0
    },
    threshold: {
      type: Number,
      default: 0
    },
    trackingEnabled: {
      type: Boolean,
      default: true
    }
  },
  shipping: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: {
        type: String,
        enum: ['CM', 'IN'],
        default: 'CM'
      }
    },
    methods: [{
      name: String,
      price: {
        type: Number,
        get: v => Math.round(v * 100) / 100, // Round to 2 decimal places
        set: v => Math.round(v * 100) / 100
      },
      estimatedDays: Number
    }]
  },
  attributes: [{
    name: String,
    value: String,
    marketplaceSpecific: Boolean
  }],
  media: [{
    url: String,
    type: {
      type: String,
      enum: ['IMAGE', 'VIDEO'],
      default: 'IMAGE'
    },
    position: Number,
    marketplaceId: String
  }],
  seo: {
    title: String,
    description: String,
    keywords: [String]
  },
  variants: [{
    marketplaceId: String,
    sku: String,
    attributes: Map,
    price: {
      type: Number,
      get: v => Math.round(v * 100) / 100, // Round to 2 decimal places
      set: v => Math.round(v * 100) / 100
    },
    quantity: Number
  }],
  syncStatus: {
    lastSync: Date,
    lastError: {
      date: Date,
      message: String,
      code: String
    },
    syncRequired: {
      type: Boolean,
      default: false
    }
  },
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    sales: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0,
      get: v => Math.round(v * 100) / 100, // Round to 2 decimal places
      set: v => Math.round(v * 100) / 100
    },
    conversionRate: {
      type: Number,
      default: 0
    }
  },
  metadata: {
    marketplaceSpecific: Map,
    internal: Map
  }
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

// Indexes
productListingSchema.index({ product: 1, marketplace: 1 }, { unique: true });
productListingSchema.index({ status: 1 });
productListingSchema.index({ 'marketplaceData.listingId': 1 });
productListingSchema.index({ 'inventory.sku': 1 });

// Virtual for available quantity
productListingSchema.virtual('availableQuantity').get(function() {
  return Math.max(0, this.inventory.quantity - this.inventory.reserved);
});

// Methods
productListingSchema.methods.updateInventory = async function(quantity, reserved = 0) {
  this.inventory.quantity = quantity;
  this.inventory.reserved = reserved;
  
  // Update status based on inventory
  if (this.availableQuantity <= 0) {
    this.status = 'OUT_OF_STOCK';
  } else if (this.status === 'OUT_OF_STOCK') {
    this.status = 'ACTIVE';
  }
  
  await this.save();
};

productListingSchema.methods.updatePricing = async function(price, compareAtPrice = null) {
  this.pricing.price = price;
  if (compareAtPrice !== null) {
    this.pricing.compareAtPrice = compareAtPrice;
  }
  this.syncStatus.syncRequired = true;
  await this.save();
};

productListingSchema.methods.recordSale = async function(quantity, revenue) {
  this.analytics.sales += quantity;
  this.analytics.revenue += revenue;
  this.analytics.conversionRate = this.analytics.sales / Math.max(1, this.analytics.views);
  await this.save();
};

// Statics
productListingSchema.statics.findNeedingSync = function() {
  return this.find({
    status: { $ne: 'ERROR' },
    'syncStatus.syncRequired': true
  });
};

productListingSchema.statics.findByMarketplace = function(marketplaceId) {
  return this.find({
    marketplace: marketplaceId,
    status: 'ACTIVE'
  });
};

productListingSchema.statics.findLowStock = function(threshold = 5) {
  return this.find({
    status: 'ACTIVE',
    'inventory.trackingEnabled': true,
    $expr: {
      $lte: [
        { $subtract: ['$inventory.quantity', '$inventory.reserved'] },
        '$inventory.threshold'
      ]
    }
  });
};

const ProductListing = mongoose.model('ProductListing', productListingSchema);

module.exports = ProductListing;
