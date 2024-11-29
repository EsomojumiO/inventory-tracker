// Register all models
require('./User');
require('./Item');
require('./Sale');
require('./Customer');
require('./Supplier');
require('./Order');
require('./Product');
require('./Category');
require('./Transaction');
require('./Payment');
require('./Inventory');
require('./StockTransaction');
require('./PurchaseOrder');
require('./AuditLog');
require('./Notification');
require('./BusinessProfile');
require('./UserPreferences');
require('./PasswordReset');

// Export models for convenience
module.exports = {
  User: require('mongoose').model('User'),
  Item: require('mongoose').model('Item'),
  Sale: require('mongoose').model('Sale'),
  Customer: require('mongoose').model('Customer'),
  Supplier: require('mongoose').model('Supplier'),
  Order: require('mongoose').model('Order'),
  Product: require('mongoose').model('Product'),
  Category: require('mongoose').model('Category'),
  Transaction: require('mongoose').model('Transaction'),
  Payment: require('mongoose').model('Payment'),
  Inventory: require('mongoose').model('Inventory'),
  StockTransaction: require('mongoose').model('StockTransaction'),
  PurchaseOrder: require('mongoose').model('PurchaseOrder'),
  AuditLog: require('mongoose').model('AuditLog'),
  Notification: require('mongoose').model('Notification'),
  BusinessProfile: require('mongoose').model('BusinessProfile'),
  UserPreferences: require('mongoose').model('UserPreferences'),
  PasswordReset: require('mongoose').model('PasswordReset')
};
