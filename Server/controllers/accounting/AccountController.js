const AccountingService = require('../../services/AccountingService');
const { validateAccount } = require('../../validators/accountingValidators');
const ApiError = require('../../utils/ApiError');
const Account = require('../../models/accounting/Account');
const Transaction = require('../../models/accounting/Transaction');

class AccountController {
    async createAccount(req, res, next) {
        try {
            const { error } = validateAccount(req.body);
            if (error) {
                throw new ApiError(400, error.details[0].message);
            }

            const account = await AccountingService.createAccount(
                req.body,
                req.user.organizationId,
                req.user.id
            );

            res.status(201).json({
                success: true,
                data: account
            });
        } catch (error) {
            next(error);
        }
    }

    async getAccounts(req, res, next) {
        try {
            const accounts = await Account.find({
                organization: req.user.organizationId,
                ...req.query
            }).sort({ code: 1 });

            res.json({
                success: true,
                data: accounts
            });
        } catch (error) {
            next(error);
        }
    }

    async getAccountById(req, res, next) {
        try {
            const account = await Account.findOne({
                _id: req.params.id,
                organization: req.user.organizationId
            });

            if (!account) {
                throw new ApiError(404, 'Account not found');
            }

            res.json({
                success: true,
                data: account
            });
        } catch (error) {
            next(error);
        }
    }

    async updateAccount(req, res, next) {
        try {
            const { error } = validateAccount(req.body);
            if (error) {
                throw new ApiError(400, error.details[0].message);
            }

            const account = await Account.findOneAndUpdate(
                {
                    _id: req.params.id,
                    organization: req.user.organizationId
                },
                {
                    ...req.body,
                    updatedBy: req.user.id
                },
                { new: true }
            );

            if (!account) {
                throw new ApiError(404, 'Account not found');
            }

            res.json({
                success: true,
                data: account
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteAccount(req, res, next) {
        try {
            // Check if account has any transactions
            const hasTransactions = await Transaction.exists({
                'entries.account': req.params.id
            });

            if (hasTransactions) {
                throw new ApiError(400, 'Cannot delete account with existing transactions');
            }

            const account = await Account.findOneAndDelete({
                _id: req.params.id,
                organization: req.user.organizationId
            });

            if (!account) {
                throw new ApiError(404, 'Account not found');
            }

            res.json({
                success: true,
                message: 'Account deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AccountController();
