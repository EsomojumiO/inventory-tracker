const nodemailer = require('nodemailer');
const twilio = require('twilio');
const logger = require('../utils/logger');

class NotificationService {
    constructor() {
        // Initialize email transport
        this.emailTransport = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            }
        });

        // Initialize Twilio client
        this.twilioClient = twilio(
            process.env.TWILIO_ACCOUNT_SID,
            process.env.TWILIO_AUTH_TOKEN
        );
    }

    // Send email notification
    async sendEmail(to, subject, content, attachments = []) {
        try {
            const mailOptions = {
                from: process.env.EMAIL_FROM,
                to,
                subject,
                html: content,
                attachments
            };

            const info = await this.emailTransport.sendMail(mailOptions);
            logger.info('Email sent:', info.messageId);
            return info;
        } catch (error) {
            logger.error('Email sending error:', error);
            throw error;
        }
    }

    // Send SMS notification
    async sendSMS(to, message) {
        try {
            const result = await this.twilioClient.messages.create({
                body: message,
                to,
                from: process.env.TWILIO_PHONE_NUMBER
            });
            logger.info('SMS sent:', result.sid);
            return result;
        } catch (error) {
            logger.error('SMS sending error:', error);
            throw error;
        }
    }

    // Send low stock alert
    async sendLowStockAlert(item, recipient) {
        const subject = `Low Stock Alert: ${item.name}`;
        const content = `
            <h2>Low Stock Alert</h2>
            <p>The following item is running low on stock:</p>
            <ul>
                <li><strong>Item:</strong> ${item.name}</li>
                <li><strong>Current Quantity:</strong> ${item.quantity}</li>
                <li><strong>Reorder Point:</strong> ${item.reorderPoint}</li>
            </ul>
            <p>Please reorder soon to avoid stockouts.</p>
        `;

        await this.sendEmail(recipient.email, subject, content);

        if (recipient.phone) {
            const smsMessage = `Low Stock Alert: ${item.name} is running low (${item.quantity} remaining). Please reorder soon.`;
            await this.sendSMS(recipient.phone, smsMessage);
        }
    }

    // Send order confirmation
    async sendOrderConfirmation(order, recipient) {
        const subject = `Order Confirmation #${order.orderNumber}`;
        const content = `
            <h2>Order Confirmation</h2>
            <p>Your order has been confirmed:</p>
            <ul>
                <li><strong>Order Number:</strong> ${order.orderNumber}</li>
                <li><strong>Date:</strong> ${new Date(order.date).toLocaleDateString()}</li>
                <li><strong>Total Amount:</strong> ₦${order.total.toFixed(2)}</li>
            </ul>
            <h3>Order Items:</h3>
            <ul>
                ${order.items.map(item => `
                    <li>${item.quantity}x ${item.name} - ₦${item.total.toFixed(2)}</li>
                `).join('')}
            </ul>
            <p>Thank you for your business!</p>
        `;

        await this.sendEmail(recipient.email, subject, content);

        if (recipient.phone) {
            const smsMessage = `Order #${order.orderNumber} confirmed. Total: ₦${order.total.toFixed(2)}. Thank you for your business!`;
            await this.sendSMS(recipient.phone, smsMessage);
        }
    }

    // Send payment receipt
    async sendPaymentReceipt(payment, recipient) {
        const subject = `Payment Receipt #${payment.receiptNumber}`;
        const content = `
            <h2>Payment Receipt</h2>
            <p>We've received your payment:</p>
            <ul>
                <li><strong>Receipt Number:</strong> ${payment.receiptNumber}</li>
                <li><strong>Date:</strong> ${new Date(payment.date).toLocaleDateString()}</li>
                <li><strong>Amount:</strong> ₦${payment.amount.toFixed(2)}</li>
                <li><strong>Payment Method:</strong> ${payment.method}</li>
            </ul>
            <p>Thank you for your payment!</p>
        `;

        await this.sendEmail(recipient.email, subject, content);

        if (recipient.phone) {
            const smsMessage = `Payment received: ₦${payment.amount.toFixed(2)}. Receipt #${payment.receiptNumber}. Thank you!`;
            await this.sendSMS(recipient.phone, smsMessage);
        }
    }

    // Send inventory report
    async sendInventoryReport(report, recipient) {
        const subject = 'Inventory Status Report';
        const content = `
            <h2>Inventory Status Report</h2>
            <p>Here's your inventory status report as of ${new Date().toLocaleDateString()}:</p>
            <h3>Low Stock Items:</h3>
            <ul>
                ${report.lowStockItems.map(item => `
                    <li>${item.name} - ${item.quantity} remaining (Reorder Point: ${item.reorderPoint})</li>
                `).join('')}
            </ul>
            <h3>Out of Stock Items:</h3>
            <ul>
                ${report.outOfStockItems.map(item => `
                    <li>${item.name}</li>
                `).join('')}
            </ul>
            <p>Please review and take necessary action.</p>
        `;

        const attachment = {
            filename: 'inventory_report.pdf',
            content: report.pdf,
            encoding: 'base64'
        };

        await this.sendEmail(recipient.email, subject, content, [attachment]);
    }
}

module.exports = new NotificationService();
