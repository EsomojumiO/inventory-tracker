const OAuthClient = require('intuit-oauth');
const QuickBooks = require('node-quickbooks');
const logger = require('../utils/logger');
const Account = require('../models/accounting/Account');
const Transaction = require('../models/accounting/Transaction');
const TaxConfiguration = require('../models/accounting/TaxConfiguration');
const mongoose = require('mongoose');

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

    // Local Accounting Methods

    async createDefaultAccounts(organizationId, userId) {
        const defaultAccounts = [
            {
                code: '1000',
                name: 'Cash',
                type: 'ASSET',
                subtype: 'CURRENT',
                description: 'Cash on hand',
                organization: organizationId,
                createdBy: userId
            },
            {
                code: '1100',
                name: 'Bank',
                type: 'ASSET',
                subtype: 'CURRENT',
                description: 'Bank accounts',
                organization: organizationId,
                createdBy: userId
            },
            {
                code: '1200',
                name: 'Accounts Receivable',
                type: 'ASSET',
                subtype: 'CURRENT',
                description: 'Money owed by customers',
                organization: organizationId,
                createdBy: userId
            },
            {
                code: '2000',
                name: 'Accounts Payable',
                type: 'LIABILITY',
                subtype: 'CURRENT',
                description: 'Money owed to suppliers',
                organization: organizationId,
                createdBy: userId
            },
            {
                code: '3000',
                name: 'Capital',
                type: 'EQUITY',
                subtype: 'OPERATING',
                description: 'Owner\'s equity',
                organization: organizationId,
                createdBy: userId
            },
            {
                code: '4000',
                name: 'Sales Revenue',
                type: 'REVENUE',
                subtype: 'OPERATING',
                description: 'Income from sales',
                organization: organizationId,
                createdBy: userId
            },
            {
                code: '5000',
                name: 'Cost of Goods Sold',
                type: 'EXPENSE',
                subtype: 'OPERATING',
                description: 'Direct costs of items sold',
                organization: organizationId,
                createdBy: userId
            }
        ];

        try {
            await Account.insertMany(defaultAccounts);
            logger.info(`Created default accounts for organization ${organizationId}`);
        } catch (error) {
            logger.error('Error creating default accounts:', error);
            throw error;
        }
    }

    async createAccount(accountData, organizationId, userId) {
        try {
            const account = new Account({
                ...accountData,
                organization: organizationId,
                createdBy: userId
            });
            await account.save();
            return account;
        } catch (error) {
            logger.error('Error creating account:', error);
            throw error;
        }
    }

    async createTransaction(transactionData, organizationId, userId) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Create the transaction
            const transaction = new Transaction({
                ...transactionData,
                organization: organizationId,
                createdBy: userId
            });

            // Update account balances
            for (const entry of transaction.entries) {
                const account = await Account.findById(entry.account).session(session);
                if (!account) {
                    throw new Error(`Account ${entry.account} not found`);
                }

                // Update balance based on debit/credit
                const balanceChange = (entry.debit || 0) - (entry.credit || 0);
                account.balance += balanceChange;
                await account.save({ session });
            }

            await transaction.save({ session });
            await session.commitTransaction();
            return transaction;
        } catch (error) {
            await session.abortTransaction();
            logger.error('Error creating transaction:', error);
            throw error;
        } finally {
            session.endSession();
        }
    }

    async configureTax(taxData, organizationId, userId) {
        try {
            const taxConfig = new TaxConfiguration({
                ...taxData,
                organization: organizationId,
                createdBy: userId
            });
            await taxConfig.save();
            return taxConfig;
        } catch (error) {
            logger.error('Error configuring tax:', error);
            throw error;
        }
    }

    async generateFinancialReport(type, organizationId, startDate, endDate) {
        try {
            const query = {
                organization: organizationId,
                date: { $gte: startDate, $lte: endDate },
                status: 'POSTED'
            };

            const transactions = await Transaction.find(query)
                .populate('entries.account')
                .sort({ date: 1 });

            switch (type) {
                case 'INCOME_STATEMENT':
                    return this.generateIncomeStatement(transactions);
                case 'BALANCE_SHEET':
                    return this.generateBalanceSheet(transactions);
                case 'CASH_FLOW':
                    return this.generateCashFlowStatement(transactions);
                default:
                    throw new Error('Invalid report type');
            }
        } catch (error) {
            logger.error('Error generating financial report:', error);
            throw error;
        }
    }

    // QuickBooks Methods (existing methods remain unchanged)
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

            const invoiceData = {
                Line: lineItems,
                CustomerRef: {
                    value: sale.customerId
                },
                TxnDate: sale.date
            };

            return new Promise((resolve, reject) => {
                this.qbo.createInvoice(invoiceData, (err, invoice) => {
                    if (err) {
                        logger.error('Error creating QuickBooks invoice:', err);
                        reject(err);
                    }
                    resolve(invoice);
                });
            });
        } catch (error) {
            logger.error('Error in createInvoice:', error);
            throw error;
        }
    }

    // Helper methods for financial reports
    generateIncomeStatement(transactions) {
        // Implementation for income statement generation
        const report = {
            revenue: {},
            expenses: {},
            netIncome: 0
        };

        transactions.forEach(transaction => {
            transaction.entries.forEach(entry => {
                const account = entry.account;
                if (account.type === 'REVENUE') {
                    report.revenue[account.name] = (report.revenue[account.name] || 0) + (entry.credit - entry.debit);
                } else if (account.type === 'EXPENSE') {
                    report.expenses[account.name] = (report.expenses[account.name] || 0) + (entry.debit - entry.credit);
                }
            });
        });

        report.netIncome = Object.values(report.revenue).reduce((a, b) => a + b, 0) -
                          Object.values(report.expenses).reduce((a, b) => a + b, 0);

        return report;
    }

    generateBalanceSheet(transactions) {
        // Implementation for balance sheet generation
        const report = {
            assets: {},
            liabilities: {},
            equity: {},
            totalAssets: 0,
            totalLiabilities: 0,
            totalEquity: 0
        };

        // Group accounts by type and calculate balances
        transactions.forEach(transaction => {
            transaction.entries.forEach(entry => {
                const account = entry.account;
                const balance = entry.debit - entry.credit;

                switch (account.type) {
                    case 'ASSET':
                        report.assets[account.name] = (report.assets[account.name] || 0) + balance;
                        break;
                    case 'LIABILITY':
                        report.liabilities[account.name] = (report.liabilities[account.name] || 0) - balance;
                        break;
                    case 'EQUITY':
                        report.equity[account.name] = (report.equity[account.name] || 0) - balance;
                        break;
                }
            });
        });

        // Calculate totals
        report.totalAssets = Object.values(report.assets).reduce((a, b) => a + b, 0);
        report.totalLiabilities = Object.values(report.liabilities).reduce((a, b) => a + b, 0);
        report.totalEquity = Object.values(report.equity).reduce((a, b) => a + b, 0);

        return report;
    }

    generateCashFlowStatement(transactions) {
        // Implementation for cash flow statement generation
        const report = {
            operatingActivities: {},
            investingActivities: {},
            financingActivities: {},
            netCashFlow: 0
        };

        // Categorize cash flows
        transactions.forEach(transaction => {
            if (transaction.type === 'PAYMENT' || transaction.type === 'RECEIPT') {
                const amount = transaction.entries.reduce((sum, entry) => {
                    if (entry.account.type === 'ASSET' && entry.account.subtype === 'CURRENT') {
                        return sum + (entry.debit - entry.credit);
                    }
                    return sum;
                }, 0);

                // Categorize based on transaction metadata or type
                if (transaction.metadata?.cashFlowCategory === 'OPERATING') {
                    report.operatingActivities[transaction.description] = amount;
                } else if (transaction.metadata?.cashFlowCategory === 'INVESTING') {
                    report.investingActivities[transaction.description] = amount;
                } else if (transaction.metadata?.cashFlowCategory === 'FINANCING') {
                    report.financingActivities[transaction.description] = amount;
                }
            }
        });

        // Calculate net cash flow
        report.netCashFlow = 
            Object.values(report.operatingActivities).reduce((a, b) => a + b, 0) +
            Object.values(report.investingActivities).reduce((a, b) => a + b, 0) +
            Object.values(report.financingActivities).reduce((a, b) => a + b, 0);

        return report;
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
}

module.exports = new AccountingService();
