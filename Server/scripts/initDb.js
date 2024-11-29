require('dotenv').config();
const mongoose = require('mongoose');
const config = require('../config/config');

// Import models
const Inventory = require('../models/Inventory');
const Sale = require('../models/Sale');

const sampleInventory = [
    {
        name: 'Laptop',
        description: 'High-performance laptop',
        sku: 'LAP001',
        category: 'Electronics',
        quantity: 50,
        minQuantity: 10,
        price: 999.99,
        supplier: {
            name: 'Tech Supplies Inc',
            contact: 'John Doe',
            email: 'john@techsupplies.com'
        },
        location: 'Warehouse A'
    },
    {
        name: 'Desk Chair',
        description: 'Ergonomic office chair',
        sku: 'CHR001',
        category: 'Furniture',
        quantity: 30,
        minQuantity: 5,
        price: 199.99,
        supplier: {
            name: 'Office Furniture Co',
            contact: 'Jane Smith',
            email: 'jane@officefurniture.com'
        },
        location: 'Warehouse B'
    },
    {
        name: 'Wireless Mouse',
        description: 'Bluetooth wireless mouse',
        sku: 'MOU001',
        category: 'Electronics',
        quantity: 100,
        minQuantity: 20,
        price: 29.99,
        supplier: {
            name: 'Tech Supplies Inc',
            contact: 'John Doe',
            email: 'john@techsupplies.com'
        },
        location: 'Warehouse A'
    }
];

async function initializeDatabase() {
    try {
        // Connect to MongoDB
        console.log('Connecting to MongoDB...');
        await mongoose.connect(config.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Clear existing data
        console.log('Clearing existing data...');
        await Inventory.deleteMany({});
        await Sale.deleteMany({});

        // Insert sample inventory
        console.log('Inserting sample inventory...');
        const insertedInventory = await Inventory.insertMany(sampleInventory);
        console.log(`Inserted ${insertedInventory.length} inventory items`);

        // Create some sample sales using the inserted inventory
        const sampleSales = [
            {
                items: [
                    {
                        product: insertedInventory[0]._id,
                        quantity: 2,
                        price: insertedInventory[0].price
                    }
                ],
                customer: {
                    name: 'Alice Johnson',
                    email: 'alice@example.com',
                    phone: '555-0100'
                },
                total: insertedInventory[0].price * 2,
                paymentMethod: 'card',
                status: 'completed'
            },
            {
                items: [
                    {
                        product: insertedInventory[1]._id,
                        quantity: 1,
                        price: insertedInventory[1].price
                    },
                    {
                        product: insertedInventory[2]._id,
                        quantity: 3,
                        price: insertedInventory[2].price
                    }
                ],
                customer: {
                    name: 'Bob Wilson',
                    email: 'bob@example.com',
                    phone: '555-0101'
                },
                total: insertedInventory[1].price + (insertedInventory[2].price * 3),
                paymentMethod: 'cash',
                status: 'completed'
            }
        ];

        console.log('Inserting sample sales...');
        const insertedSales = await Sale.insertMany(sampleSales);
        console.log(`Inserted ${insertedSales.length} sales`);

        console.log('Database initialization complete!');
    } catch (error) {
        console.error('Error initializing database:', error);
    } finally {
        await mongoose.disconnect();
    }
}

// Run the initialization
initializeDatabase();
