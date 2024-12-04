const AccountingService = require('../../services/AccountingService');
const { validateTransaction } = require('../../validators/accountingValidators');
const ApiError = require('../../utils/ApiError');

class TransactionController {
    async createTransaction(req, res, next) {
        try {
            const { error } = validateTransaction(req.body);
            if (error) {
                throw new ApiError(400, error.details[0].message);
            }

            const transaction = await AccountingService.createTransaction(
                req.body,
                req.user.organizationId,
                req.user.id
            );

            res.status(201).json({
                success: true,
                data: transaction
            });
        } catch (error) {
            next(error);
        }
    }

    async getTransactions(req, res, next) {
        try {
            const { startDate, endDate, type, status } = req.query;
            const query = {
                organization: req.user.organizationId
            };

            if (startDate && endDate) {
                query.date = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                };
            }

            if (type) query.type = type;
            if (status) query.status = status;

            const transactions = await Transaction.find(query)
                .populate('entries.account')
                .sort({ date: -1 });

            res.json({
                success: true,
                data: transactions
            });
        } catch (error) {
            next(error);
        }
    }

    async getTransactionById(req, res, next) {
        try {
            const transaction = await Transaction.findOne({
                _id: req.params.id,
                organization: req.user.organizationId
            }).populate('entries.account');

            if (!transaction) {
                throw new ApiError(404, 'Transaction not found');
            }

            res.json({
                success: true,
                data: transaction
            });
        } catch (error) {
            next(error);
        }
    }

    async updateTransaction(req, res, next) {
        try {
            const { error } = validateTransaction(req.body);
            if (error) {
                throw new ApiError(400, error.details[0].message);
            }

            const transaction = await Transaction.findOne({
                _id: req.params.id,
                organization: req.user.organizationId
            });

            if (!transaction) {
                throw new ApiError(404, 'Transaction not found');
            }

            if (transaction.status === 'POSTED') {
                throw new ApiError(400, 'Cannot update posted transaction');
            }

            Object.assign(transaction, req.body);
            transaction.updatedBy = req.user.id;
            await transaction.save();

            res.json({
                success: true,
                data: transaction
            });
        } catch (error) {
            next(error);
        }
    }

    async postTransaction(req, res, next) {
        try {
            const transaction = await Transaction.findOne({
                _id: req.params.id,
                organization: req.user.organizationId
            });

            if (!transaction) {
                throw new ApiError(404, 'Transaction not found');
            }

            if (transaction.status === 'POSTED') {
                throw new ApiError(400, 'Transaction already posted');
            }

            transaction.status = 'POSTED';
            transaction.updatedBy = req.user.id;
            await transaction.save();

            res.json({
                success: true,
                data: transaction
            });
        } catch (error) {
            next(error);
        }
    }

    async voidTransaction(req, res, next) {
        try {
            const transaction = await Transaction.findOne({
                _id: req.params.id,
                organization: req.user.organizationId
            });

            if (!transaction) {
                throw new ApiError(404, 'Transaction not found');
            }

            if (transaction.status === 'VOID') {
                throw new ApiError(400, 'Transaction already voided');
            }

            // Create reversal entries
            const reversalEntries = transaction.entries.map(entry => ({
                account: entry.account,
                debit: entry.credit,
                credit: entry.debit,
                description: `Reversal: ${entry.description}`
            }));

            // Create reversal transaction
            await AccountingService.createTransaction({
                type: transaction.type,
                status: 'POSTED',
                reference: `VOID-${transaction.reference}`,
                description: `Void: ${transaction.description}`,
                entries: reversalEntries
            }, req.user.organizationId, req.user.id);

            // Update original transaction
            transaction.status = 'VOID';
            transaction.updatedBy = req.user.id;
            await transaction.save();

            res.json({
                success: true,
                message: 'Transaction voided successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    async generateFinancialReport(req, res, next) {
        try {
            const { type, startDate, endDate } = req.query;

            if (!type || !startDate || !endDate) {
                throw new ApiError(400, 'Report type, start date, and end date are required');
            }

            const report = await AccountingService.generateFinancialReport(
                type,
                req.user.organizationId,
                new Date(startDate),
                new Date(endDate)
            );

            res.json({
                success: true,
                data: report
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new TransactionController();
