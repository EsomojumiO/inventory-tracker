const express = require('express');
const router = express.Router();
const AccountController = require('../controllers/accounting/AccountController');
const TransactionController = require('../controllers/accounting/TransactionController');
const { authenticate, authorize } = require('../middleware/auth');

// Account routes
router.post('/accounts',
    authenticate,
    authorize(['admin', 'accountant']),
    AccountController.createAccount
);

router.get('/accounts',
    authenticate,
    AccountController.getAccounts
);

router.get('/accounts/:id',
    authenticate,
    AccountController.getAccountById
);

router.put('/accounts/:id',
    authenticate,
    authorize(['admin', 'accountant']),
    AccountController.updateAccount
);

router.delete('/accounts/:id',
    authenticate,
    authorize(['admin']),
    AccountController.deleteAccount
);

// Transaction routes
router.post('/transactions',
    authenticate,
    authorize(['admin', 'accountant']),
    TransactionController.createTransaction
);

router.get('/transactions',
    authenticate,
    TransactionController.getTransactions
);

router.get('/transactions/:id',
    authenticate,
    TransactionController.getTransactionById
);

router.put('/transactions/:id',
    authenticate,
    authorize(['admin', 'accountant']),
    TransactionController.updateTransaction
);

router.post('/transactions/:id/post',
    authenticate,
    authorize(['admin', 'accountant']),
    TransactionController.postTransaction
);

router.post('/transactions/:id/void',
    authenticate,
    authorize(['admin']),
    TransactionController.voidTransaction
);

// Financial Reports
router.get('/reports/financial',
    authenticate,
    authorize(['admin', 'accountant', 'viewer']),
    TransactionController.generateFinancialReport
);

module.exports = router;
