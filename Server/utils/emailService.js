const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.templates = new Map();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    // Create transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Load email templates
    await this.loadTemplates();

    this.initialized = true;
  }

  async loadTemplates() {
    const templatesDir = path.join(__dirname, '../templates/email');
    const templates = await fs.readdir(templatesDir);

    for (const template of templates) {
      if (template.endsWith('.hbs')) {
        const templateName = path.basename(template, '.hbs');
        const templateContent = await fs.readFile(
          path.join(templatesDir, template),
          'utf-8'
        );
        this.templates.set(templateName, handlebars.compile(templateContent));
      }
    }
  }

  async sendEmail({ to, subject, template, context, attachments = [] }) {
    try {
      await this.initialize();

      if (!this.templates.has(template)) {
        throw new Error(`Email template '${template}' not found`);
      }

      const templateFn = this.templates.get(template);
      const html = templateFn(context);

      const mailOptions = {
        from: process.env.SMTP_FROM,
        to,
        subject,
        html,
        attachments
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error('Error sending email:', error);
      throw error;
    }
  }

  async sendPurchaseOrderEmail(po, pdfBuffer) {
    return this.sendEmail({
      to: po.supplier.email,
      subject: `Purchase Order ${po.poNumber}`,
      template: 'purchase-order',
      context: {
        supplierName: po.supplier.name,
        poNumber: po.poNumber,
        total: po.totals.total,
        expectedDeliveryDate: po.expectedDeliveryDate,
        items: po.items.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice
        }))
      },
      attachments: [{
        filename: `PO_${po.poNumber}.pdf`,
        content: pdfBuffer
      }]
    });
  }

  async sendLowStockAlert(product, supplier) {
    return this.sendEmail({
      to: process.env.INVENTORY_ALERT_EMAIL,
      subject: `Low Stock Alert: ${product.name}`,
      template: 'low-stock-alert',
      context: {
        productName: product.name,
        sku: product.sku,
        currentStock: product.quantity,
        threshold: product.lowStockThreshold,
        supplier: {
          name: supplier.name,
          contact: supplier.contact
        },
        reorderPoint: product.reorderPoint,
        reorderQuantity: product.reorderQuantity
      }
    });
  }

  async sendSupplierPerformanceReport(supplier, metrics) {
    return this.sendEmail({
      to: process.env.SUPPLIER_REPORTS_EMAIL,
      subject: `Supplier Performance Report: ${supplier.name}`,
      template: 'supplier-performance',
      context: {
        supplierName: supplier.name,
        period: metrics.period,
        metrics: {
          totalOrders: metrics.totalOrders,
          totalValue: metrics.totalValue,
          onTimeDeliveryRate: metrics.onTimeDeliveryRate.toFixed(2) + '%',
          qualityIssueRate: metrics.qualityIssueRate.toFixed(2) + '%',
          averageOrderValue: metrics.averageOrderValue.toFixed(2)
        }
      }
    });
  }

  async sendOrderConfirmation(po) {
    return this.sendEmail({
      to: po.supplier.email,
      subject: `Order Confirmation: PO ${po.poNumber}`,
      template: 'order-confirmation',
      context: {
        supplierName: po.supplier.name,
        poNumber: po.poNumber,
        orderDate: po.createdAt,
        expectedDeliveryDate: po.expectedDeliveryDate,
        items: po.items.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice
        })),
        totals: po.totals,
        shippingAddress: po.shippingAddress
      }
    });
  }

  async sendDeliveryReminder(po) {
    const daysUntilDelivery = Math.ceil(
      (po.expectedDeliveryDate - new Date()) / (1000 * 60 * 60 * 24)
    );

    return this.sendEmail({
      to: po.supplier.email,
      subject: `Delivery Reminder: PO ${po.poNumber}`,
      template: 'delivery-reminder',
      context: {
        supplierName: po.supplier.name,
        poNumber: po.poNumber,
        daysUntilDelivery,
        expectedDeliveryDate: po.expectedDeliveryDate,
        items: po.items.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          receivedQuantity: item.receivedQuantity || 0,
          remainingQuantity: item.quantity - (item.receivedQuantity || 0)
        }))
      }
    });
  }
}

module.exports = new EmailService();
