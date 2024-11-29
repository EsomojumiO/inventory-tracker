const axios = require('axios');
const crypto = require('crypto');
const BaseAdapter = require('./BaseAdapter');
const logger = require('../utils/logger');

class JumiaAdapter extends BaseAdapter {
  constructor() {
    super();
    this.requiredCredentials = ['apiKey', 'apiSecret', 'sellerId', 'apiUrl'];
    this.client = null;
  }

  async validateCredentials(credentials) {
    this.validateRequiredCredentials(credentials, this.requiredCredentials);
    
    try {
      const client = this.createClient(credentials);
      await client.get('/seller/info');
      return true;
    } catch (error) {
      throw new Error('Invalid Jumia credentials: ' + error.message);
    }
  }

  createClient(credentials) {
    const { apiKey, apiSecret, apiUrl } = credentials;
    
    return axios.create({
      baseURL: apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Retail-Master/1.0'
      },
      auth: {
        username: apiKey,
        password: apiSecret
      }
    });
  }

  async initializeClient(credentials) {
    if (!this.client) {
      this.client = this.createClient(credentials);
    }
    return this.client;
  }

  generateSignature(data, secret) {
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(data))
      .digest('hex');
  }

  async syncProduct(product, listing) {
    try {
      const client = await this.initializeClient(listing.marketplace.credentials);
      const productData = this.formatProductData(product, listing);
      
      let response;
      if (listing.marketplaceData?.listingId) {
        response = await this.retryWithBackoff(() =>
          client.put(`/products/${listing.marketplaceData.listingId}`, productData)
        );
      } else {
        response = await this.retryWithBackoff(() =>
          client.post('/products', productData)
        );
      }

      return {
        listingId: response.data.productId,
        url: response.data.productUrl,
        categoryId: response.data.categoryId
      };
    } catch (error) {
      this.handleApiError(error, 'Error syncing product to Jumia');
    }
  }

  formatProductData(product, listing) {
    const data = this.sanitizeProductData(product);
    
    return {
      name: data.title,
      description: data.description,
      price: data.price.amount,
      quantity: data.quantity,
      sku: this.generateSKU(product, 'JUMIA'),
      images: data.images,
      attributes: this.mapAttributes(data.attributes),
      categoryId: listing.marketplaceData?.categoryId,
      condition: listing.marketplaceData?.condition || 'NEW',
      shipping: {
        weight: listing.shipping?.weight,
        length: listing.shipping?.dimensions?.length,
        width: listing.shipping?.dimensions?.width,
        height: listing.shipping?.dimensions?.height
      }
    };
  }

  mapAttributes(attributes) {
    // Map internal attributes to Jumia-specific attributes
    const attributeMapping = {
      color: 'Color',
      size: 'Size',
      brand: 'Brand',
      material: 'Material'
      // Add more mappings as needed
    };

    const mapped = {};
    for (const [key, value] of Object.entries(attributes)) {
      const jumiaKey = attributeMapping[key.toLowerCase()];
      if (jumiaKey) {
        mapped[jumiaKey] = value;
      }
    }
    return mapped;
  }

  async updateInventory(listing, quantity) {
    try {
      const client = await this.initializeClient(listing.marketplace.credentials);
      
      await this.retryWithBackoff(() =>
        client.put(`/products/${listing.marketplaceData.listingId}/inventory`, {
          quantity: Math.max(0, quantity)
        })
      );
      
      return true;
    } catch (error) {
      this.handleApiError(error, 'Error updating Jumia inventory');
    }
  }

  async updatePrice(listing, price) {
    try {
      const client = await this.initializeClient(listing.marketplace.credentials);
      
      await this.retryWithBackoff(() =>
        client.put(`/products/${listing.marketplaceData.listingId}/price`, {
          price: this.formatPrice(price).amount
        })
      );
      
      return true;
    } catch (error) {
      this.handleApiError(error, 'Error updating Jumia price');
    }
  }

  async fetchNewOrders(since = new Date(Date.now() - 24 * 60 * 60 * 1000)) {
    try {
      const client = await this.initializeClient(listing.marketplace.credentials);
      
      const response = await this.retryWithBackoff(() =>
        client.get('/orders', {
          params: {
            created_after: since.toISOString(),
            status: 'pending'
          }
        })
      );

      return response.data.orders.map(this.formatOrder);
    } catch (error) {
      this.handleApiError(error, 'Error fetching Jumia orders');
    }
  }

  formatOrder(jumiaOrder) {
    return {
      marketplace: 'JUMIA',
      marketplaceOrderId: jumiaOrder.orderId,
      status: this.mapOrderStatus(jumiaOrder.status),
      customerName: jumiaOrder.customer.name,
      customerEmail: jumiaOrder.customer.email,
      shippingAddress: {
        street: jumiaOrder.shippingAddress.street,
        city: jumiaOrder.shippingAddress.city,
        state: jumiaOrder.shippingAddress.state,
        country: jumiaOrder.shippingAddress.country,
        postalCode: jumiaOrder.shippingAddress.postalCode
      },
      items: jumiaOrder.items.map(item => ({
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
        productName: item.name
      })),
      totals: {
        subtotal: jumiaOrder.subtotal,
        shipping: jumiaOrder.shippingFee,
        tax: jumiaOrder.tax,
        total: jumiaOrder.total
      },
      paymentMethod: jumiaOrder.paymentMethod,
      paymentStatus: jumiaOrder.paymentStatus,
      createdAt: new Date(jumiaOrder.createdAt),
      updatedAt: new Date(jumiaOrder.updatedAt)
    };
  }

  mapOrderStatus(jumiaStatus) {
    const statusMap = {
      'pending': 'PENDING',
      'processing': 'PROCESSING',
      'shipped': 'SHIPPED',
      'delivered': 'DELIVERED',
      'cancelled': 'CANCELLED'
    };
    return statusMap[jumiaStatus.toLowerCase()] || 'UNKNOWN';
  }

  async cancelOrder(order) {
    try {
      const client = await this.initializeClient(listing.marketplace.credentials);
      
      await this.retryWithBackoff(() =>
        client.post(`/orders/${order.marketplaceOrderId}/cancel`)
      );
      
      return true;
    } catch (error) {
      this.handleApiError(error, 'Error cancelling Jumia order');
    }
  }

  async updateOrderStatus(order, status) {
    try {
      const client = await this.initializeClient(listing.marketplace.credentials);
      
      await this.retryWithBackoff(() =>
        client.put(`/orders/${order.marketplaceOrderId}/status`, {
          status: this.mapOrderStatus(status)
        })
      );
      
      return true;
    } catch (error) {
      this.handleApiError(error, 'Error updating Jumia order status');
    }
  }

  parseWebhookData(data) {
    try {
      const event = {
        type: data.event_type,
        timestamp: new Date(data.timestamp),
        data: {}
      };

      switch (data.event_type) {
        case 'order.created':
          event.data = this.formatOrder(data.order);
          break;
        case 'order.updated':
          event.data = {
            orderId: data.order.orderId,
            oldStatus: this.mapOrderStatus(data.old_status),
            newStatus: this.mapOrderStatus(data.new_status)
          };
          break;
        case 'product.updated':
          event.data = {
            productId: data.product.productId,
            sku: data.product.sku,
            changes: data.changes
          };
          break;
        default:
          logger.warn(`Unknown Jumia webhook event type: ${data.event_type}`);
      }

      return event;
    } catch (error) {
      throw new Error(`Error parsing Jumia webhook data: ${error.message}`);
    }
  }

  validateWebhookSignature(signature, payload, secret) {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}

module.exports = JumiaAdapter;
