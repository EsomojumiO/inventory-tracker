class BaseAdapter {
  constructor() {
    if (this.constructor === BaseAdapter) {
      throw new Error('BaseAdapter is an abstract class and cannot be instantiated directly');
    }
  }

  async validateCredentials(credentials) {
    throw new Error('validateCredentials must be implemented by the adapter');
  }

  async syncProduct(product, listing) {
    throw new Error('syncProduct must be implemented by the adapter');
  }

  async updateInventory(listing, quantity) {
    throw new Error('updateInventory must be implemented by the adapter');
  }

  async updatePrice(listing, price) {
    throw new Error('updatePrice must be implemented by the adapter');
  }

  async fetchNewOrders() {
    throw new Error('fetchNewOrders must be implemented by the adapter');
  }

  async cancelOrder(order) {
    throw new Error('cancelOrder must be implemented by the adapter');
  }

  async updateOrderStatus(order, status) {
    throw new Error('updateOrderStatus must be implemented by the adapter');
  }

  // Utility methods that can be used by all adapters
  validateRequiredCredentials(credentials, requiredFields) {
    const missing = requiredFields.filter(field => !credentials[field]);
    if (missing.length > 0) {
      throw new Error(`Missing required credentials: ${missing.join(', ')}`);
    }
  }

  formatPrice(price, currency = 'NGN') {
    return {
      amount: Math.round(price * 100) / 100,
      currency
    };
  }

  handleApiError(error, context = '') {
    const errorMessage = error.response?.data?.message || error.message;
    throw new Error(`${context}: ${errorMessage}`);
  }

  async retryWithBackoff(operation, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt === maxRetries) break;
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw lastError;
  }

  sanitizeProductData(product) {
    return {
      title: this.sanitizeString(product.name),
      description: this.sanitizeString(product.description),
      sku: this.sanitizeString(product.sku),
      price: this.formatPrice(product.price),
      quantity: Math.max(0, product.quantity || 0),
      images: (product.images || []).map(img => this.sanitizeString(img.url)),
      attributes: this.sanitizeAttributes(product.attributes)
    };
  }

  sanitizeString(str) {
    if (!str) return '';
    return str.trim()
      .replace(/[<>]/g, '') // Remove HTML tags
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, ''); // Remove control characters
  }

  sanitizeAttributes(attributes) {
    if (!attributes) return {};
    const sanitized = {};
    for (const [key, value] of Object.entries(attributes)) {
      if (value != null) {
        sanitized[this.sanitizeString(key)] = this.sanitizeString(value.toString());
      }
    }
    return sanitized;
  }

  generateSKU(product, marketplace) {
    const base = product.sku || product._id.toString();
    return `${marketplace.toLowerCase()}-${base}`;
  }

  parseWebhookData(data) {
    throw new Error('parseWebhookData must be implemented by the adapter');
  }

  validateWebhookSignature(signature, payload, secret) {
    throw new Error('validateWebhookSignature must be implemented by the adapter');
  }
}

module.exports = BaseAdapter;
