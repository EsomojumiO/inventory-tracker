module.exports = {
    stripe: {
        publicKey: process.env.STRIPE_PUBLIC_KEY,
        secretKey: process.env.STRIPE_SECRET_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
        returnUrl: process.env.STRIPE_RETURN_URL,
        currency: 'ngn',
        statementDescriptor: 'Retail Master'
    },
    paypal: {
        clientId: process.env.PAYPAL_CLIENT_ID,
        clientSecret: process.env.PAYPAL_CLIENT_SECRET,
        mode: process.env.NODE_ENV === 'production' ? 'live' : 'sandbox',
        currency: 'NGN',
        returnUrl: process.env.PAYPAL_RETURN_URL,
        cancelUrl: process.env.PAYPAL_CANCEL_URL
    },
    flutterwave: {
        publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY,
        secretKey: process.env.FLUTTERWAVE_SECRET_KEY,
        encryptionKey: process.env.FLUTTERWAVE_ENCRYPTION_KEY,
        webhookSecret: process.env.FLUTTERWAVE_WEBHOOK_SECRET,
        currency: 'NGN',
        environment: process.env.NODE_ENV === 'production' ? 'live' : 'test'
    },
    mobileMoney: {
        redirectUrl: process.env.MOBILE_MONEY_REDIRECT_URL,
        supportedNetworks: ['MTN', 'AIRTEL', 'GLO', '9MOBILE'],
        minimumAmount: 100,
        maximumAmount: 10000000
    },
    general: {
        supportedMethods: [
            'CASH',
            'CARD',
            'BANK_TRANSFER',
            'MOBILE_MONEY',
            'PAYPAL',
            'FLUTTERWAVE'
        ],
        defaultCurrency: 'NGN',
        minimumAmount: 100, // 1 NGN
        maximumAmount: 100000000, // 1,000,000 NGN
        splitPaymentEnabled: true,
        maxSplitRecipients: 10,
        autoCapture: true,
        refundWindow: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
        webhookTimeout: 10000, // 10 seconds
        retryAttempts: 3
    },
    fees: {
        stripe: {
            percentage: 2.9,
            fixed: 100 // 1 NGN
        },
        paypal: {
            percentage: 3.9,
            fixed: 200 // 2 NGN
        },
        flutterwave: {
            percentage: 1.4,
            fixed: 50 // 0.50 NGN
        },
        mobileMoney: {
            percentage: 1.5,
            fixed: 50 // 0.50 NGN
        }
    }
};
