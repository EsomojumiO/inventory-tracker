const OAuthClient = require('intuit-oauth');
const QuickBooks = require('node-quickbooks');
const logger = require('../utils/logger');

class AccountingService {
    constructor() {
        this.oauthClient = new OAuthClient({
            clientId: process.env.QUICKBOOKS_CLIENT_ID,
            clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET,
            environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
            redirectUri: process.env.QUICKBOOKS_REDIRECT_URI
        });

        this.qbo = null;
    }

    // Initialize QuickBooks client
    initializeQBO(accessToken, realmId) {
        this.qbo = new QuickBooks(
            process.env.QUICKBOOKS_CLIENT_ID,
            process.env.QUICKBOOKS_CLIENT_SECRET,
            accessToken,
            false, // no token secret for oAuth 2.0
            realmId,
            process.env.NODE_ENV === 'production' ? false : true, // sandbox flag
            true, // debug flag
            null, // minor version
            '2.0', // oauth version
            accessToken // refresh token
        );
    }

    // Create invoice in QuickBooks
    async createInvoice(sale) {
        try {
            if (!this.qbo) {
                throw new Error('QuickBooks client not initialized');
            }

            const lineItems = sale.items.map(item => ({
                Amount: item.total,
                DetailType: "SalesItemLineDetail",
                SalesItemLineDetail: {
                    ItemRef: {
                        value: item.productId,
                        name: item.productName
                    },
                    UnitPrice: item.unitPrice,
                    Qty: item.quantity
                }
            }));

            const invoice = {
                Line: lineItems,
                CustomerRef: {
                    value: sale.customerId
                },
                TxnDate: sale.date,
                DueDate: sale.dueDate
            };

            return new Promise((resolve, reject) => {
                this.qbo.createInvoice(invoice, (err, result) => {
                    if (err) {
                        logger.error('QuickBooks invoice creation error:', err);
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
        } catch (error) {
            logger.error('QuickBooks service error:', error);
            throw error;
        }
    }

    // Sync inventory item with QuickBooks
    async syncInventoryItem(item) {
        try {
            if (!this.qbo) {
                throw new Error('QuickBooks client not initialized');
            }

            const qbItem = {
                Name: item.name,
                Type: "Inventory",
                TrackQtyOnHand: true,
                QtyOnHand: item.quantity,
                InvStartDate: new Date().toISOString(),
                IncomeAccountRef: {
                    value: process.env.QUICKBOOKS_INCOME_ACCOUNT
                },
                AssetAccountRef: {
                    value: process.env.QUICKBOOKS_ASSET_ACCOUNT
                },
                ExpenseAccountRef: {
                    value: process.env.QUICKBOOKS_EXPENSE_ACCOUNT
                }
            };

            return new Promise((resolve, reject) => {
                this.qbo.createItem(qbItem, (err, result) => {
                    if (err) {
                        logger.error('QuickBooks item sync error:', err);
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
        } catch (error) {
            logger.error('QuickBooks service error:', error);
            throw error;
        }
    }

    // Generate financial report
    async generateFinancialReport(startDate, endDate, reportType) {
        try {
            if (!this.qbo) {
                throw new Error('QuickBooks client not initialized');
            }

            return new Promise((resolve, reject) => {
                this.qbo.report(reportType, {
                    start_date: startDate,
                    end_date: endDate
                }, (err, report) => {
                    if (err) {
                        logger.error('QuickBooks report generation error:', err);
                        reject(err);
                    } else {
                        resolve(report);
                    }
                });
            });
        } catch (error) {
            logger.error('QuickBooks service error:', error);
            throw error;
        }
    }

    // Get authorization URL
    getAuthorizationUrl() {
        return this.oauthClient.authorizeUri({
            scope: [
                OAuthClient.scopes.Accounting,
                OAuthClient.scopes.OpenId
            ],
            state: 'randomState'
        });
    }

    // Handle OAuth callback
    async handleCallback(url) {
        try {
            const authResponse = await this.oauthClient.createToken(url);
            const { access_token, refresh_token, realmId } = authResponse.token;
            
            this.initializeQBO(access_token, realmId);
            
            return {
                accessToken: access_token,
                refreshToken: refresh_token,
                realmId
            };
        } catch (error) {
            logger.error('QuickBooks OAuth error:', error);
            throw error;
        }
    }

    // Refresh access token
    async refreshToken(refreshToken) {
        try {
            const authResponse = await this.oauthClient.refresh();
            const { access_token, refresh_token } = authResponse.token;
            
            return {
                accessToken: access_token,
                refreshToken: refresh_token
            };
        } catch (error) {
            logger.error('QuickBooks token refresh error:', error);
            throw error;
        }
    }
}

module.exports = new AccountingService();
