const Joi = require('joi');

const accountSchema = Joi.object({
    code: Joi.string().required(),
    name: Joi.string().required(),
    type: Joi.string().valid('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE').required(),
    subtype: Joi.string().valid('CURRENT', 'NON_CURRENT', 'OPERATING', 'NON_OPERATING').required(),
    description: Joi.string(),
    parentAccount: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
    currency: Joi.string().default('NGN'),
    isActive: Joi.boolean().default(true)
});

const transactionEntrySchema = Joi.object({
    account: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    debit: Joi.number().min(0).default(0),
    credit: Joi.number().min(0).default(0),
    description: Joi.string()
}).custom((value, helpers) => {
    if ((value.debit && value.credit) || (!value.debit && !value.credit)) {
        return helpers.error('Either debit or credit must be specified, but not both');
    }
    return value;
});

const transactionSchema = Joi.object({
    date: Joi.date().default(Date.now),
    type: Joi.string().valid('SALE', 'PURCHASE', 'EXPENSE', 'JOURNAL', 'PAYMENT', 'RECEIPT').required(),
    reference: Joi.string().required(),
    description: Joi.string(),
    entries: Joi.array().items(transactionEntrySchema).min(2).required(),
    attachments: Joi.array().items(Joi.object({
        name: Joi.string().required(),
        url: Joi.string().uri().required(),
        type: Joi.string().required()
    })),
    metadata: Joi.object(),
    currency: Joi.string().default('NGN'),
    exchangeRate: Joi.number().positive().default(1)
}).custom((value, helpers) => {
    let totalDebit = 0;
    let totalCredit = 0;
    
    value.entries.forEach(entry => {
        totalDebit += entry.debit || 0;
        totalCredit += entry.credit || 0;
    });
    
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
        return helpers.error('Total debits must equal total credits');
    }
    return value;
});

const taxConfigurationSchema = Joi.object({
    name: Joi.string().required(),
    type: Joi.string().valid('VAT', 'WITHHOLDING', 'SALES', 'CUSTOM').required(),
    rates: Joi.array().items(Joi.object({
        name: Joi.string().required(),
        rate: Joi.number().min(0).max(100).required(),
        description: Joi.string(),
        isDefault: Joi.boolean().default(false)
    })).min(1).required(),
    accountPayable: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    accountReceivable: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    isActive: Joi.boolean().default(true)
});

module.exports = {
    validateAccount: (data) => accountSchema.validate(data),
    validateTransaction: (data) => transactionSchema.validate(data),
    validateTaxConfiguration: (data) => taxConfigurationSchema.validate(data)
};
