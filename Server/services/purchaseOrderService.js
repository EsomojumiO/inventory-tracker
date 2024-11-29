const PurchaseOrder = require('../models/PurchaseOrder');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const logger = require('../utils/logger');
const { sendEmail } = require('../utils/emailService');
const { generatePDF } = require('../utils/pdfGenerator');

class PurchaseOrderService {
  constructor() {
    this.STATUS = {
      DRAFT: 'DRAFT',
      PENDING: 'PENDING',
      APPROVED: 'APPROVED',
      ORDERED: 'ORDERED',
      PARTIALLY_RECEIVED: 'PARTIALLY_RECEIVED',
      RECEIVED: 'RECEIVED',
      CANCELLED: 'CANCELLED'
    };
  }

  async createPurchaseOrder(data) {
    try {
      const supplier = await Supplier.findById(data.supplier);
      if (!supplier) {
        throw new Error('Supplier not found');
      }

      // Generate PO number
      const poNumber = await this.generatePONumber();

      const po = new PurchaseOrder({
        poNumber,
        supplier: data.supplier,
        items: await this.validateAndFormatItems(data.items),
        expectedDeliveryDate: data.expectedDeliveryDate,
        shippingAddress: data.shippingAddress,
        status: this.STATUS.DRAFT,
        notes: data.notes,
        metadata: {
          createdBy: data.userId,
          department: data.department
        }
      });

      // Calculate totals
      await this.calculateTotals(po);
      
      await po.save();
      return po;
    } catch (error) {
      logger.error('Error creating purchase order:', error);
      throw error;
    }
  }

  async validateAndFormatItems(items) {
    const formattedItems = await Promise.all(items.map(async (item) => {
      const product = await Product.findById(item.product);
      if (!product) {
        throw new Error(`Product not found: ${item.product}`);
      }

      return {
        product: item.product,
        quantity: item.quantity,
        unitPrice: item.unitPrice || product.cost,
        tax: item.tax || 0,
        discount: item.discount || 0,
        expectedDeliveryDate: item.expectedDeliveryDate
      };
    }));

    return formattedItems;
  }

  async calculateTotals(po) {
    let subtotal = 0;
    let tax = 0;
    let discount = 0;

    po.items.forEach(item => {
      const itemTotal = item.quantity * item.unitPrice;
      subtotal += itemTotal;
      tax += (itemTotal * item.tax) / 100;
      discount += (itemTotal * item.discount) / 100;
    });

    po.totals = {
      subtotal,
      tax,
      discount,
      total: subtotal + tax - discount
    };
  }

  async generatePONumber() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    // Get the latest PO number for this month
    const latestPO = await PurchaseOrder.findOne({
      poNumber: new RegExp(`^PO${year}${month}`)
    }).sort({ poNumber: -1 });

    let sequence = '001';
    if (latestPO) {
      const currentSequence = parseInt(latestPO.poNumber.slice(-3));
      sequence = (currentSequence + 1).toString().padStart(3, '0');
    }

    return `PO${year}${month}${sequence}`;
  }

  async approvePurchaseOrder(poId, approverId) {
    try {
      const po = await PurchaseOrder.findById(poId).populate('supplier');
      if (!po) {
        throw new Error('Purchase order not found');
      }

      if (po.status !== this.STATUS.PENDING) {
        throw new Error('Purchase order is not in pending status');
      }

      po.status = this.STATUS.APPROVED;
      po.metadata.approvedBy = approverId;
      po.metadata.approvedAt = new Date();

      await po.save();

      // Generate PO PDF
      const pdfBuffer = await this.generatePOPDF(po);

      // Send email to supplier
      await this.sendPOToSupplier(po, pdfBuffer);

      return po;
    } catch (error) {
      logger.error('Error approving purchase order:', error);
      throw error;
    }
  }

  async generatePOPDF(po) {
    // Format PO data for PDF generation
    const data = {
      poNumber: po.poNumber,
      date: po.createdAt,
      supplier: {
        name: po.supplier.name,
        address: po.supplier.address,
        contact: po.supplier.contact
      },
      items: po.items.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice
      })),
      totals: po.totals,
      terms: po.supplier.paymentTerms
    };

    return await generatePDF('purchase-order', data);
  }

  async sendPOToSupplier(po, pdfBuffer) {
    const emailData = {
      to: po.supplier.email,
      subject: `Purchase Order ${po.poNumber}`,
      template: 'purchase-order',
      context: {
        supplierName: po.supplier.name,
        poNumber: po.poNumber,
        total: po.totals.total,
        expectedDeliveryDate: po.expectedDeliveryDate
      },
      attachments: [{
        filename: `PO_${po.poNumber}.pdf`,
        content: pdfBuffer
      }]
    };

    await sendEmail(emailData);
  }

  async receivePurchaseOrder(poId, receivedItems) {
    try {
      const po = await PurchaseOrder.findById(poId);
      if (!po) {
        throw new Error('Purchase order not found');
      }

      if (po.status !== this.STATUS.ORDERED && po.status !== this.STATUS.PARTIALLY_RECEIVED) {
        throw new Error('Purchase order is not in ordered status');
      }

      // Update received quantities and status
      let allItemsReceived = true;
      po.items = po.items.map(item => {
        const receivedItem = receivedItems.find(ri => ri.product.equals(item.product));
        if (receivedItem) {
          item.receivedQuantity = (item.receivedQuantity || 0) + receivedItem.quantity;
          if (item.receivedQuantity < item.quantity) {
            allItemsReceived = false;
          }
        }
        return item;
      });

      po.status = allItemsReceived ? this.STATUS.RECEIVED : this.STATUS.PARTIALLY_RECEIVED;
      po.metadata.lastReceiptDate = new Date();

      await po.save();

      // Update product inventory
      await this.updateInventory(receivedItems);

      return po;
    } catch (error) {
      logger.error('Error receiving purchase order:', error);
      throw error;
    }
  }

  async updateInventory(receivedItems) {
    for (const item of receivedItems) {
      const product = await Product.findById(item.product);
      if (product) {
        product.quantity += item.quantity;
        if (product.quantity > product.lowStockThreshold && product.status === 'LOW_STOCK') {
          product.status = 'IN_STOCK';
        }
        await product.save();
      }
    }
  }

  async checkAndCreateAutoPO() {
    try {
      // Get all products below reorder point
      const lowStockProducts = await Product.find({
        quantity: { $lte: '$reorderPoint' },
        supplier: { $exists: true }
      }).populate('supplier');

      // Group products by supplier
      const supplierProducts = {};
      lowStockProducts.forEach(product => {
        if (!supplierProducts[product.supplier._id]) {
          supplierProducts[product.supplier._id] = [];
        }
        supplierProducts[product.supplier._id].push({
          product: product._id,
          quantity: product.reorderQuantity,
          unitPrice: product.cost
        });
      });

      // Create POs for each supplier
      const createdPOs = [];
      for (const [supplierId, items] of Object.entries(supplierProducts)) {
        const poData = {
          supplier: supplierId,
          items,
          expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          status: this.STATUS.DRAFT,
          metadata: {
            autoGenerated: true
          }
        };

        const po = await this.createPurchaseOrder(poData);
        createdPOs.push(po);
      }

      return createdPOs;
    } catch (error) {
      logger.error('Error creating auto purchase orders:', error);
      throw error;
    }
  }

  async getPendingPOsBySupplier(supplierId) {
    return await PurchaseOrder.find({
      supplier: supplierId,
      status: { $in: [this.STATUS.ORDERED, this.STATUS.PARTIALLY_RECEIVED] }
    }).sort({ createdAt: -1 });
  }

  async getSupplierMetrics(supplierId, startDate, endDate) {
    const completedPOs = await PurchaseOrder.find({
      supplier: supplierId,
      status: this.STATUS.RECEIVED,
      createdAt: { $gte: startDate, $lte: endDate }
    });

    let totalOrders = completedPOs.length;
    let totalValue = 0;
    let onTimeDeliveries = 0;
    let qualityIssues = 0;

    completedPOs.forEach(po => {
      totalValue += po.totals.total;
      if (po.metadata.lastReceiptDate <= po.expectedDeliveryDate) {
        onTimeDeliveries++;
      }
      if (po.metadata.qualityIssues) {
        qualityIssues++;
      }
    });

    return {
      totalOrders,
      totalValue,
      onTimeDeliveryRate: totalOrders ? (onTimeDeliveries / totalOrders) * 100 : 0,
      qualityIssueRate: totalOrders ? (qualityIssues / totalOrders) * 100 : 0,
      averageOrderValue: totalOrders ? totalValue / totalOrders : 0
    };
  }
}

module.exports = new PurchaseOrderService();
