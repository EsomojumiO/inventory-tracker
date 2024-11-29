const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const paypal = require('@paypal/checkout-server-sdk');
const Flutterwave = require('flutterwave-node-v3');
const Payment = require('../models/Payment');
const logger = require('../utils/logger');

// PayPal client configuration
let paypalClient;
if (process.env.NODE_ENV === 'production') {
    paypalClient = new paypal.core.LiveEnvironment(
        process.env.PAYPAL_CLIENT_ID,
        process.env.PAYPAL_CLIENT_SECRET
    );
} else {
    paypalClient = new paypal.core.SandboxEnvironment(
        process.env.PAYPAL_CLIENT_ID,
        process.env.PAYPAL_CLIENT_SECRET
    );
}
const paypalInstance = new paypal.core.PayPalHttpClient(paypalClient);

// Flutterwave configuration
const flw = new Flutterwave(
    process.env.FLUTTERWAVE_PUBLIC_KEY,
    process.env.FLUTTERWAVE_SECRET_KEY
);

class PaymentService {
    // Create a new payment record
    async createPayment(orderId, amount, method, splits = []) {
        const payment = new Payment({
            orderId,
            amount,
            method,
            splits: splits.map(split => ({
                recipient: split.recipientId,
                amount: split.amount
            }))
        });
        await payment.save();
        return payment;
    }

    // Process payment based on method
    async processPayment(paymentId, paymentData) {
        const payment = await Payment.findById(paymentId);
        if (!payment) {
            throw new Error('Payment not found');
        }

        let result;
        try {
            switch (payment.method) {
                case 'CARD':
                    result = await this.processStripePayment(
                        payment.amount,
                        paymentData.paymentMethod,
                        `Payment for order ${payment.orderId}`
                    );
                    break;
                case 'PAYPAL':
                    result = await this.processPayPalPayment(
                        payment.amount,
                        `Payment for order ${payment.orderId}`
                    );
                    break;
                case 'FLUTTERWAVE':
                    result = await this.processFlutterwavePayment(
                        payment,
                        paymentData
                    );
                    break;
                case 'MOBILE_MONEY':
                    result = await this.processMobileMoneyPayment(
                        payment,
                        paymentData
                    );
                    break;
                default:
                    throw new Error(`Unsupported payment method: ${payment.method}`);
            }

            payment.gatewayReference = result.paymentId || result.orderId;
            payment.gatewayResponse = result;
            payment.status = 'COMPLETED';
            await payment.save();

            if (payment.splits.length > 0) {
                await this.processSplitPayments(payment);
            }

            return { success: true, payment };
        } catch (error) {
            payment.status = 'FAILED';
            payment.gatewayResponse = error;
            await payment.save();
            throw error;
        }
    }

    // Stripe payment processing
    async processStripePayment(amount, paymentMethod, description) {
        try {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // Convert to kobo
                currency: 'ngn',
                payment_method: paymentMethod,
                description,
                confirm: true,
                return_url: process.env.STRIPE_RETURN_URL
            });

            return {
                success: true,
                paymentId: paymentIntent.id,
                status: paymentIntent.status
            };
        } catch (error) {
            logger.error('Stripe payment error:', error);
            throw new Error('Payment processing failed');
        }
    }

    // PayPal payment processing
    async processPayPalPayment(amount, description) {
        try {
            const request = new paypal.orders.OrdersCreateRequest();
            request.prefer("return=representation");
            request.requestBody({
                intent: 'CAPTURE',
                purchase_units: [{
                    amount: {
                        currency_code: 'NGN',
                        value: amount.toString()
                    },
                    description
                }]
            });

            const order = await paypalInstance.execute(request);
            return {
                success: true,
                orderId: order.result.id,
                status: order.result.status,
                approvalUrl: order.result.links.find(link => link.rel === 'approve').href
            };
        } catch (error) {
            logger.error('PayPal payment error:', error);
            throw new Error('PayPal payment processing failed');
        }
    }

    // Capture PayPal payment after approval
    async capturePayPalPayment(orderId) {
        try {
            const request = new paypal.orders.OrdersCaptureRequest(orderId);
            const capture = await paypalInstance.execute(request);
            return {
                success: true,
                captureId: capture.result.purchase_units[0].payments.captures[0].id,
                status: capture.result.status
            };
        } catch (error) {
            logger.error('PayPal capture error:', error);
            throw new Error('PayPal payment capture failed');
        }
    }

    // Process Flutterwave payment
    async processFlutterwavePayment(payment, paymentData) {
        try {
            const payload = {
                card_number: paymentData.cardNumber,
                cvv: paymentData.cvv,
                expiry_month: paymentData.expiryMonth,
                expiry_year: paymentData.expiryYear,
                currency: 'NGN',
                amount: payment.amount,
                email: paymentData.email,
                tx_ref: `ORDER-${payment.orderId}-${Date.now()}`,
                fullname: paymentData.fullname
            };

            if (payment.splits.length > 0) {
                payload.subaccounts = payment.splits.map(split => ({
                    id: split.recipient.flutterwaveSubAccountId,
                    transaction_charge_type: "flat",
                    transaction_charge: 0,
                    transaction_split_ratio: Math.floor((split.amount / payment.amount) * 100)
                }));
            }

            const response = await flw.Charge.card(payload);
            
            if (response.status === 'success') {
                return {
                    success: true,
                    paymentId: response.data.id,
                    status: response.status
                };
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            logger.error('Flutterwave payment error:', error);
            throw new Error('Flutterwave payment processing failed');
        }
    }

    // Process Mobile Money payment
    async processMobileMoneyPayment(payment, paymentData) {
        try {
            const payload = {
                tx_ref: `ORDER-${payment.orderId}-${Date.now()}`,
                amount: payment.amount,
                currency: 'NGN',
                email: paymentData.email,
                phone_number: paymentData.phoneNumber,
                network: paymentData.network, // MTN, VODAFONE, etc.
                redirect_url: process.env.MOBILE_MONEY_REDIRECT_URL
            };

            const response = await flw.MobileMoney.initiate(payload);
            
            if (response.status === 'success') {
                return {
                    success: true,
                    paymentId: response.data.id,
                    status: response.status,
                    ussdCode: response.data.ussdCode,
                    paymentUrl: response.data.paymentUrl
                };
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            logger.error('Mobile Money payment error:', error);
            throw new Error('Mobile Money payment processing failed');
        }
    }

    // Process split payments
    async processSplitPayments(payment) {
        for (const split of payment.splits) {
            try {
                // Process the split payment based on the payment method
                switch (payment.method) {
                    case 'STRIPE':
                        await this.processStripeSplitTransfer(payment, split);
                        break;
                    case 'PAYPAL':
                        await this.processPayPalSplitPayout(payment, split);
                        break;
                    case 'FLUTTERWAVE':
                        // Flutterwave handles splits automatically
                        split.status = 'COMPLETED';
                        break;
                }
            } catch (error) {
                logger.error(`Split payment error for recipient ${split.recipient}:`, error);
                split.status = 'FAILED';
            }
        }
        await payment.save();
    }

    // Process Stripe split transfer
    async processStripeSplitTransfer(payment, split) {
        try {
            const transfer = await stripe.transfers.create({
                amount: Math.round(split.amount * 100),
                currency: 'ngn',
                destination: split.recipient.stripeAccountId,
                transfer_group: `ORDER-${payment.orderId}`
            });
            split.status = 'COMPLETED';
            return transfer;
        } catch (error) {
            logger.error('Stripe transfer error:', error);
            throw error;
        }
    }

    // Process PayPal split payout
    async processPayPalSplitPayout(payment, split) {
        try {
            const request = new paypal.payments.PayoutsPostRequest();
            request.requestBody({
                sender_batch_header: {
                    sender_batch_id: `SPLIT-${payment.orderId}-${Date.now()}`,
                    email_subject: "You have a payment"
                },
                items: [{
                    recipient_type: "EMAIL",
                    amount: {
                        value: split.amount,
                        currency: "NGN"
                    },
                    receiver: split.recipient.paypalEmail,
                    note: `Split payment for order ${payment.orderId}`
                }]
            });

            const response = await paypalInstance.execute(request);
            split.status = 'COMPLETED';
            return response.result;
        } catch (error) {
            logger.error('PayPal payout error:', error);
            throw error;
        }
    }

    // Refund Stripe payment
    async refundStripePayment(paymentIntentId, amount) {
        try {
            const refund = await stripe.refunds.create({
                payment_intent: paymentIntentId,
                amount: amount ? Math.round(amount * 100) : undefined // Convert to kobo
            });
            return {
                success: true,
                refundId: refund.id,
                status: refund.status
            };
        } catch (error) {
            logger.error('Stripe refund error:', error);
            throw new Error('Refund processing failed');
        }
    }

    // Refund PayPal payment
    async refundPayPalPayment(captureId, amount) {
        try {
            const request = new paypal.payments.CapturesRefundRequest(captureId);
            request.requestBody({
                amount: {
                    currency_code: 'NGN',
                    value: amount.toString()
                }
            });

            const refund = await paypalInstance.execute(request);
            return {
                success: true,
                refundId: refund.result.id,
                status: refund.result.status
            };
        } catch (error) {
            logger.error('PayPal refund error:', error);
            throw new Error('PayPal refund processing failed');
        }
    }

    // Refund Flutterwave payment
    async refundFlutterwavePayment(transactionId, amount) {
        try {
            const response = await flw.Transaction.refund({
                id: transactionId,
                amount: amount
            });

            return {
                success: true,
                refundId: response.data.id,
                status: response.status
            };
        } catch (error) {
            logger.error('Flutterwave refund error:', error);
            throw new Error('Flutterwave refund processing failed');
        }
    }

    // Verify Flutterwave transaction
    async verifyFlutterwaveTransaction(transactionId) {
        try {
            const response = await flw.Transaction.verify({
                id: transactionId
            });

            return {
                success: true,
                status: response.data.status,
                amount: response.data.amount,
                currency: response.data.currency
            };
        } catch (error) {
            logger.error('Flutterwave verification error:', error);
            throw new Error('Transaction verification failed');
        }
    }
}

module.exports = new PaymentService();
