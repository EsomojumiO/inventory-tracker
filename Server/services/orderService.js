const Order = require('../models/Order');
const Product = require('../models/Product');
const inventoryService = require('./inventoryService');
const { generateDocument } = require('../utils/documentGenerator');

class OrderService {
  async createOrder(orderData, userId) {
    try {
      // Generate order number
      const orderNumber = await Order.generateOrderNumber();
      
      // Create new order
      const order = new Order({
        ...orderData,
        orderNumber,
        processedBy: userId
      });

      // Update inventory for each item
      for (const item of order.items) {
        const product = await Product.findById(item.product);
        if (!product) {
          throw new Error(`Product not found: ${item.product}`);
        }

        // Check stock availability
        const location = order.type === 'IN_STORE' ? 'physical' : 'online';
        const currentStock = product.getStockByLocation(location);
        if (currentStock < item.quantity) {
          throw new Error(`Insufficient stock for product: ${product.name}`);
        }

        // Update stock
        await inventoryService.updateStockLevel(
          item.product,
          currentStock - item.quantity,
          location
        );
      }

      await order.save();
      return order;
    } catch (error) {
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  async updateOrderStatus(orderId, status, userId) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      await order.updateStatus(status, userId);
      return order;
    } catch (error) {
      throw new Error(`Failed to update order status: ${error.message}`);
    }
  }

  async addTrackingInfo(orderId, trackingInfo) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      await order.addTrackingInfo(trackingInfo);
      return order;
    } catch (error) {
      throw new Error(`Failed to add tracking info: ${error.message}`);
    }
  }

  async processPayment(orderId, paymentDetails) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      await order.markAsPaid(paymentDetails);
      return order;
    } catch (error) {
      throw new Error(`Failed to process payment: ${error.message}`);
    }
  }

  async generateInvoice(orderId, businessInfo) {
    try {
      const order = await Order.findById(orderId)
        .populate('items.product');
      
      if (!order) {
        throw new Error('Order not found');
      }

      const documentData = {
        documentNumber: order.orderNumber,
        date: order.createdAt,
        customer: order.customer,
        items: order.items.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount
        })),
        subtotal: order.subtotal,
        tax: order.tax,
        shipping: order.shipping,
        discount: order.discount,
        total: order.total
      };

      const document = generateDocument(documentData, 'invoice', businessInfo);
      return document;
    } catch (error) {
      throw new Error(`Failed to generate invoice: ${error.message}`);
    }
  }

  async generateReceipt(orderId, businessInfo) {
    try {
      const order = await Order.findById(orderId)
        .populate('items.product');
      
      if (!order) {
        throw new Error('Order not found');
      }

      const documentData = {
        documentNumber: order.orderNumber,
        date: order.createdAt,
        customer: order.customer,
        items: order.items.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount
        })),
        subtotal: order.subtotal,
        tax: order.tax,
        shipping: order.shipping,
        discount: order.discount,
        total: order.total,
        payment: order.payment
      };

      const document = generateDocument(documentData, 'receipt', businessInfo);
      return document;
    } catch (error) {
      throw new Error(`Failed to generate receipt: ${error.message}`);
    }
  }

  // eCommerce platform integrations
  async syncShopifyOrder(shopifyOrder) {
    try {
      const orderData = {
        source: 'SHOPIFY',
        type: 'ONLINE',
        customer: {
          name: shopifyOrder.customer.name,
          email: shopifyOrder.customer.email,
          phone: shopifyOrder.customer.phone,
          address: shopifyOrder.shippingAddress
        },
        items: shopifyOrder.lineItems.map(item => ({
          product: item.productId, // Mapped Shopify product ID to local product ID
          quantity: item.quantity,
          price: item.price,
          discount: item.discount
        })),
        shipping: shopifyOrder.shippingPrice,
        tax: shopifyOrder.taxPrice,
        payment: {
          method: 'OTHER',
          reference: shopifyOrder.paymentReference
        }
      };

      return await this.createOrder(orderData);
    } catch (error) {
      throw new Error(`Failed to sync Shopify order: ${error.message}`);
    }
  }

  async syncWooCommerceOrder(wooOrder) {
    try {
      const orderData = {
        source: 'WOOCOMMERCE',
        type: 'ONLINE',
        customer: {
          name: wooOrder.billing.first_name + ' ' + wooOrder.billing.last_name,
          email: wooOrder.billing.email,
          phone: wooOrder.billing.phone,
          address: {
            street: wooOrder.shipping.address_1,
            city: wooOrder.shipping.city,
            state: wooOrder.shipping.state,
            postalCode: wooOrder.shipping.postcode,
            country: wooOrder.shipping.country
          }
        },
        items: wooOrder.line_items.map(item => ({
          product: item.product_id, // Mapped WooCommerce product ID to local product ID
          quantity: item.quantity,
          price: item.price,
          discount: item.discount
        })),
        shipping: wooOrder.shipping_total,
        tax: wooOrder.total_tax,
        payment: {
          method: 'OTHER',
          reference: wooOrder.transaction_id
        }
      };

      return await this.createOrder(orderData);
    } catch (error) {
      throw new Error(`Failed to sync WooCommerce order: ${error.message}`);
    }
  }

  // Analytics methods
  async getOrderStats(startDate, endDate) {
    try {
      const stats = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalRevenue: { $sum: '$total' },
            averageOrderValue: { $avg: '$total' },
            totalItems: { $sum: { $size: '$items' } }
          }
        }
      ]);

      return stats[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        totalItems: 0
      };
    } catch (error) {
      throw new Error(`Failed to get order stats: ${error.message}`);
    }
  }
}

module.exports = new OrderService();
