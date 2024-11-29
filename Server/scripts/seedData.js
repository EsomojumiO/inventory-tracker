require('dotenv').config();
const mongoose = require('mongoose');
const Inventory = require('../models/Inventory');
const Supplier = require('../models/Supplier');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const Sale = require('../models/Sale');
const { User } = require('../models/User');
const Category = require('../models/Category');
const bcrypt = require('bcryptjs');

// Create a dummy user for the seed data
const DUMMY_USER = {
  _id: new mongoose.Types.ObjectId(),
  username: 'demo',
  email: 'demo@example.com',
  password: bcrypt.hashSync('demo123', 10),
  firstName: 'Demo',
  lastName: 'User',
  role: 'admin',
  businessName: 'Demo Store',
  businessAddress: '123 Demo Street',
  businessPhone: '555-0000',
  businessEmail: 'business@example.com',
  status: 'active',
  loginAttempts: 0
};

// Categories
const categories = [
  { name: 'Electronics', description: 'Electronic devices and accessories' },
  { name: 'Clothing', description: 'Apparel and fashion items' },
  { name: 'Food & Beverages', description: 'Consumable items' },
  { name: 'Home & Garden', description: 'Home improvement and garden supplies' },
  { name: 'Sports & Outdoors', description: 'Sports equipment and outdoor gear' },
  { name: 'Books', description: 'Books and publications' },
  { name: 'Health & Beauty', description: 'Personal care and beauty products' },
  { name: 'Toys & Games', description: 'Entertainment items for all ages' }
];

// Sample data
const suppliers = [
  {
    name: 'Tech Supplies Inc.',
    code: 'TECH001',
    contactPerson: 'John Smith',
    email: 'john@techsupplies.com',
    phone: '555-0100',
    address: {
      street: '123 Tech Street',
      city: 'Silicon Valley',
      state: 'CA',
      country: 'USA',
      zipCode: '94025'
    },
    paymentTerms: 'net30',
    status: 'active',
    rating: 4,
    createdBy: DUMMY_USER._id
  },
  {
    name: 'Global Electronics',
    code: 'GLOB001',
    contactPerson: 'Sarah Johnson',
    email: 'sarah@globalelec.com',
    phone: '555-0101',
    address: {
      street: '456 Electronics Ave',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      zipCode: '10001'
    },
    paymentTerms: 'net30',
    status: 'active',
    rating: 5,
    createdBy: DUMMY_USER._id
  }
];

const customers = [
  {
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@example.com',
    phone: '555-0201',
    address: {
      street: '111 Retail Row',
      city: 'Boston',
      state: 'MA',
      country: 'USA',
      zipCode: '02108'
    },
    notes: 'Retail store owner',
    tags: ['retail', 'business'],
    createdBy: DUMMY_USER._id
  },
  {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@example.com',
    phone: '555-0202',
    address: {
      street: '222 Customer Lane',
      city: 'Miami',
      state: 'FL',
      country: 'USA',
      zipCode: '33101'
    },
    notes: 'Regular customer',
    tags: ['individual'],
    createdBy: DUMMY_USER._id
  }
];

const inventory = [
  {
    name: 'Laptop Pro X',
    sku: 'TECH-001',
    barcode: 'LP' + Math.random().toString(36).substring(2, 10).toUpperCase(),
    category: 'Electronics',
    quantity: 50,
    price: 1299.99,
    description: 'High-performance laptop with latest specifications',
    minQuantity: 10,
    createdBy: DUMMY_USER._id
  },
  {
    name: 'Wireless Mouse',
    sku: 'TECH-002',
    barcode: 'WM' + Math.random().toString(36).substring(2, 10).toUpperCase(),
    category: 'Electronics',
    quantity: 100,
    price: 29.99,
    description: 'Ergonomic wireless mouse with long battery life',
    minQuantity: 20,
    createdBy: DUMMY_USER._id
  },
  {
    name: 'Designer T-Shirt',
    sku: 'CLOTH-001',
    barcode: 'DT' + Math.random().toString(36).substring(2, 10).toUpperCase(),
    category: 'Clothing',
    quantity: 200,
    price: 24.99,
    description: 'Premium cotton t-shirt with modern design',
    minQuantity: 30,
    createdBy: DUMMY_USER._id
  }
];

// Generate orders
const generateOrders = (customers, inventory) => {
  const orders = [];
  const statuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  const paymentMethods = ['CASH', 'CARD', 'TRANSFER'];
  const types = ['IN_STORE', 'ONLINE'];
  const sources = ['POS', 'SHOPIFY', 'WOOCOMMERCE', 'OTHER'];
  
  for (let i = 0; i < 20; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const orderItems = [];
    const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items per order
    
    let subtotal = 0;
    for (let j = 0; j < numItems; j++) {
      const item = inventory[Math.floor(Math.random() * inventory.length)];
      const quantity = Math.floor(Math.random() * 5) + 1;
      const price = item.price;
      
      orderItems.push({
        product: item._id,
        name: item.name,
        quantity: quantity,
        price: price
      });
      
      subtotal += quantity * price;
    }
    
    const tax = subtotal * 0.075; // 7.5% tax
    const total = subtotal + tax;
    
    orders.push({
      customer: {
        _id: customer._id,
        name: `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
        phone: customer.phone
      },
      items: orderItems,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      type: types[Math.floor(Math.random() * types.length)],
      source: sources[Math.floor(Math.random() * sources.length)],
      payment: {
        method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        status: 'COMPLETED'
      },
      subtotal: subtotal,
      tax: tax,
      total: total,
      orderNumber: `ORD-${(i + 1).toString().padStart(5, '0')}`,
      createdBy: DUMMY_USER._id,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000) // Random date within last 30 days
    });
  }
  
  return orders;
};

// Generate sales
const generateSales = (customers, inventory) => {
  const sales = [];
  const statuses = ['pending', 'completed', 'cancelled', 'refunded', 'partially_refunded'];
  const paymentMethods = ['cash', 'card', 'transfer', 'check', 'credit'];
  
  for (let i = 0; i < 20; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const saleItems = [];
    const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items per sale
    
    let subtotal = 0;
    let totalCost = 0;
    for (let j = 0; j < numItems; j++) {
      const item = inventory[Math.floor(Math.random() * inventory.length)];
      const quantity = Math.floor(Math.random() * 5) + 1;
      const price = item.price;
      const cost = price * 0.6; // 40% margin
      
      saleItems.push({
        product: item._id,
        quantity: quantity,
        price: price,
        cost: cost,
        discount: 0
      });
      
      subtotal += quantity * price;
      totalCost += quantity * cost;
    }
    
    const tax = subtotal * 0.075; // 7.5% tax
    const total = subtotal + tax;
    const profit = total - totalCost;
    
    const date = new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000);
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hour = date.getHours().toString().padStart(2, '0');
    const minute = date.getMinutes().toString().padStart(2, '0');
    const saleNumber = `S${year}${month}${day}${hour}${minute}${i.toString().padStart(2, '0')}`;
    const invoiceNumber = `INV${year}${month}${day}${hour}${minute}${i.toString().padStart(2, '0')}`;
    
    sales.push({
      saleNumber: saleNumber,
      items: saleItems,
      customer: customer._id,
      subtotal: subtotal,
      taxes: [{
        name: 'VAT',
        rate: 7.5,
        amount: tax
      }],
      total: total,
      profit: profit,
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      salesPerson: DUMMY_USER._id,
      invoice: {
        number: invoiceNumber,
        date: date,
        dueDate: new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from sale date
        terms: 'Net 30'
      },
      createdAt: date
    });
  }
  
  return sales;
};

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Supplier.deleteMany({}),
      Customer.deleteMany({}),
      Inventory.deleteMany({}),
      Order.deleteMany({}),
      Sale.deleteMany({})
    ]);
    console.log('Cleared existing data');

    // Create demo user
    const user = await User.create(DUMMY_USER);
    console.log('Created demo user');

    // Create categories
    const createdCategories = await Category.create(
      categories.map(cat => ({ ...cat, createdBy: user._id }))
    );
    console.log('Created categories');

    // Create suppliers
    const createdSuppliers = await Supplier.create(suppliers);
    console.log('Created suppliers');

    // Create customers
    const createdCustomers = await Customer.create(customers);
    console.log('Created customers');

    // Create inventory items
    const createdInventory = await Inventory.create(inventory);
    console.log('Created inventory items');

    // Generate and create orders
    const orders = generateOrders(createdCustomers, createdInventory);
    await Order.create(orders);
    console.log('Created orders');

    // Generate and create sales
    const sales = generateSales(createdCustomers, createdInventory);
    await Sale.create(sales);
    console.log('Created sales');

    console.log('Database seeded successfully!');
    console.log('Demo user credentials:');
    console.log('Email:', DUMMY_USER.email);
    console.log('Password: demo123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
