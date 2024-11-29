const mongoose = require('mongoose');

const marketplaceIntegrationSchema = new mongoose.Schema({
  platform: {
    type: String,
    enum: ['JUMIA', 'AMAZON', 'KONGA', 'JIJI', 'SHOPIFY', 'WOOCOMMERCE'],
    required: true
  },
  name: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'ERROR', 'PENDING'],
    default: 'PENDING'
  },
  credentials: {
    apiKey: String,
    apiSecret: String,
    accessToken: String,
    refreshToken: String,
    sellerId: String,
    storeUrl: String,
    additionalKeys: Map
  },
  settings: {
    autoSync: {
      type: Boolean,
      default: true
    },
    syncInterval: {
      type: Number,
      default: 30, // minutes
      min: 5,
      max: 1440
    },
    inventory: {
      syncStock: {
        type: Boolean,
        default: true
      },
      stockThreshold: {
        type: Number,
        default: 0
      },
      reserveStock: {
        type: Number,
        default: 0
      }
    },
    pricing: {
      autoUpdatePrices: {
        type: Boolean,
        default: false
      },
      markupPercentage: {
        type: Number,
        default: 0
      },
      roundPricesToNearest: {
        type: Number,
        default: 0
      }
    },
    orders: {
      autoFulfill: {
        type: Boolean,
        default: false
      },
      importOrders: {
        type: Boolean,
        default: true
      },
      fulfillmentStatus: [{
        marketplace: String,
        internal: String
      }]
    }
  },
  syncStatus: {
    lastSync: Date,
    nextSync: Date,
    productsSynced: {
      type: Number,
      default: 0
    },
    ordersSynced: {
      type: Number,
      default: 0
    },
    errors: [{
      date: Date,
      message: String,
      code: String,
      details: mongoose.Schema.Types.Mixed
    }]
  },
  mappings: {
    categories: [{
      marketplace: String,
      internal: String
    }],
    attributes: [{
      marketplace: String,
      internal: String
    }],
    shippingMethods: [{
      marketplace: String,
      internal: String
    }]
  },
  webhooks: [{
    event: String,
    url: String,
    active: Boolean
  }]
}, {
  timestamps: true
});

// Indexes
marketplaceIntegrationSchema.index({ platform: 1 });
marketplaceIntegrationSchema.index({ status: 1 });
marketplaceIntegrationSchema.index({ 'syncStatus.lastSync': 1 });

// Methods
marketplaceIntegrationSchema.methods.updateSyncStatus = async function() {
  this.syncStatus.lastSync = new Date();
  this.syncStatus.nextSync = new Date(Date.now() + this.settings.syncInterval * 60000);
  await this.save();
};

marketplaceIntegrationSchema.methods.logError = async function(error) {
  this.syncStatus.errors.push({
    date: new Date(),
    message: error.message,
    code: error.code,
    details: error.details
  });
  
  if (this.syncStatus.errors.length > 100) {
    this.syncStatus.errors = this.syncStatus.errors.slice(-100);
  }
  
  await this.save();
};

marketplaceIntegrationSchema.methods.updateCredentials = async function(credentials) {
  this.credentials = {
    ...this.credentials,
    ...credentials
  };
  await this.save();
};

// Statics
marketplaceIntegrationSchema.statics.findDueForSync = function() {
  return this.find({
    status: 'ACTIVE',
    'settings.autoSync': true,
    'syncStatus.nextSync': { $lte: new Date() }
  });
};

marketplaceIntegrationSchema.statics.findByPlatform = function(platform) {
  return this.find({
    platform,
    status: 'ACTIVE'
  });
};

const MarketplaceIntegration = mongoose.model('MarketplaceIntegration', marketplaceIntegrationSchema);

module.exports = MarketplaceIntegration;
