const MarketplaceIntegration = require('../models/MarketplaceIntegration');
const ProductListing = require('../models/ProductListing');
const Product = require('../models/Product');
const logger = require('../utils/logger');

class MarketplaceService {
  constructor() {
    this.platformAdapters = new Map();
    this.initializeAdapters();
  }

  initializeAdapters() {
    // Initialize platform-specific adapters
    this.registerAdapter('JUMIA', require('../adapters/JumiaAdapter'));
    this.registerAdapter('AMAZON', require('../adapters/AmazonAdapter'));
    this.registerAdapter('KONGA', require('../adapters/KongaAdapter'));
    this.registerAdapter('SHOPIFY', require('../adapters/ShopifyAdapter'));
  }

  registerAdapter(platform, AdapterClass) {
    this.platformAdapters.set(platform, new AdapterClass());
  }

  async getAdapter(integration) {
    const adapter = this.platformAdapters.get(integration.platform);
    if (!adapter) {
      throw new Error(`No adapter found for platform: ${integration.platform}`);
    }
    return adapter;
  }

  async createIntegration(integrationData) {
    try {
      const integration = new MarketplaceIntegration(integrationData);
      await integration.save();
      
      const adapter = await this.getAdapter(integration);
      await adapter.validateCredentials(integration.credentials);
      
      return integration;
    } catch (error) {
      logger.error('Error creating marketplace integration:', error);
      throw error;
    }
  }

  async syncProduct(product, integration) {
    try {
      const adapter = await this.getAdapter(integration);
      
      // Find or create product listing
      let listing = await ProductListing.findOne({
        product: product._id,
        marketplace: integration._id
      });
      
      if (!listing) {
        listing = new ProductListing({
          product: product._id,
          marketplace: integration._id,
          pricing: {
            price: product.price,
            currency: 'NGN'
          },
          inventory: {
            quantity: product.quantity,
            sku: product.sku
          }
        });
      }

      // Sync with marketplace
      const marketplaceData = await adapter.syncProduct(product, listing);
      
      // Update listing with marketplace data
      listing.marketplaceData = marketplaceData;
      listing.status = 'ACTIVE';
      listing.syncStatus.lastSync = new Date();
      listing.syncStatus.syncRequired = false;
      
      await listing.save();
      return listing;
    } catch (error) {
      logger.error('Error syncing product:', error);
      throw error;
    }
  }

  async syncInventory(product) {
    try {
      // Find all active listings for this product
      const listings = await ProductListing.find({
        product: product._id,
        status: 'ACTIVE'
      }).populate('marketplace');

      const results = [];
      for (const listing of listings) {
        try {
          const adapter = await this.getAdapter(listing.marketplace);
          await adapter.updateInventory(listing, product.quantity);
          
          listing.inventory.quantity = product.quantity;
          listing.syncStatus.lastSync = new Date();
          await listing.save();
          
          results.push({ listing, success: true });
        } catch (error) {
          logger.error(`Error syncing inventory for listing ${listing._id}:`, error);
          results.push({ listing, success: false, error });
        }
      }

      return results;
    } catch (error) {
      logger.error('Error in syncInventory:', error);
      throw error;
    }
  }

  async syncPricing(product) {
    try {
      const listings = await ProductListing.find({
        product: product._id,
        status: 'ACTIVE'
      }).populate('marketplace');

      const results = [];
      for (const listing of listings) {
        try {
          if (listing.pricing.autoPrice.enabled) {
            const calculatedPrice = await this.calculatePrice(listing, product.price);
            const adapter = await this.getAdapter(listing.marketplace);
            await adapter.updatePrice(listing, calculatedPrice);
            
            listing.pricing.price = calculatedPrice;
            listing.syncStatus.lastSync = new Date();
            await listing.save();
          }
          
          results.push({ listing, success: true });
        } catch (error) {
          logger.error(`Error syncing price for listing ${listing._id}:`, error);
          results.push({ listing, success: false, error });
        }
      }

      return results;
    } catch (error) {
      logger.error('Error in syncPricing:', error);
      throw error;
    }
  }

  async calculatePrice(listing, basePrice) {
    const rules = listing.pricing.autoPrice.rules || [];
    let finalPrice = basePrice;

    for (const rule of rules) {
      switch (rule.type) {
        case 'FIXED':
          finalPrice = rule.value;
          break;
        case 'PERCENTAGE':
          finalPrice *= (1 + rule.value / 100);
          break;
        case 'FORMULA':
          // Evaluate custom pricing formula
          finalPrice = eval(rule.value.replace('x', finalPrice));
          break;
      }
    }

    // Ensure price is within bounds
    if (listing.pricing.autoPrice.minPrice) {
      finalPrice = Math.max(finalPrice, listing.pricing.autoPrice.minPrice);
    }
    if (listing.pricing.autoPrice.maxPrice) {
      finalPrice = Math.min(finalPrice, listing.pricing.autoPrice.maxPrice);
    }

    return Math.round(finalPrice * 100) / 100; // Round to 2 decimal places
  }

  async importOrders(integration) {
    try {
      const adapter = await this.getAdapter(integration);
      const orders = await adapter.fetchNewOrders();
      
      // Process and save orders
      const results = await Promise.all(orders.map(async (order) => {
        try {
          // Convert marketplace order to internal format
          const internalOrder = await this.convertMarketplaceOrder(order, integration);
          
          // Update inventory and analytics
          await this.processMarketplaceOrder(internalOrder);
          
          return { order: internalOrder, success: true };
        } catch (error) {
          logger.error(`Error processing order ${order.id}:`, error);
          return { order, success: false, error };
        }
      }));

      return results;
    } catch (error) {
      logger.error('Error importing orders:', error);
      throw error;
    }
  }

  async convertMarketplaceOrder(marketplaceOrder, integration) {
    // Implementation specific to your Order model and business logic
    // This would convert the marketplace-specific order format to your internal format
    return marketplaceOrder;
  }

  async processMarketplaceOrder(order) {
    // Implementation specific to your Order model and business logic
    // This would handle inventory updates, analytics, and any other necessary processing
    return order;
  }

  async scheduleSyncTasks() {
    try {
      const integrations = await MarketplaceIntegration.findDueForSync();
      
      for (const integration of integrations) {
        try {
          // Sync products that need updating
          const listings = await ProductListing.findNeedingSync()
            .where('marketplace').equals(integration._id)
            .populate('product');
          
          for (const listing of listings) {
            await this.syncProduct(listing.product, integration);
          }
          
          // Import new orders
          if (integration.settings.orders.importOrders) {
            await this.importOrders(integration);
          }
          
          await integration.updateSyncStatus();
        } catch (error) {
          logger.error(`Error in scheduled sync for integration ${integration._id}:`, error);
          await integration.logError(error);
        }
      }
    } catch (error) {
      logger.error('Error in scheduleSyncTasks:', error);
      throw error;
    }
  }
}

module.exports = new MarketplaceService();
