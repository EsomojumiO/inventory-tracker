const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;
const fs = require('fs');
const { authenticateToken } = require('../middleware/authMiddleware');
const Inventory = require('../models/Inventory');
const Category = require('../models/Category');
const bwipjs = require('bwip-js');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'uploads/';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Explicitly define routes in order of specificity
const routes = express.Router();

// Dashboard endpoint (must be before /:id)
router.get('/dashboard', authenticateToken, async (req, res) => {
    try {
        const items = await Inventory.find({}, null, { lean: true })
            .select('name category price quantity lowStockThreshold createdAt updatedAt')
            .sort('-createdAt');

        const summary = {
            totalItems: items.length,
            lowStock: items.filter(item => item.quantity <= (item.lowStockThreshold || 10)).length,
            outOfStock: items.filter(item => item.quantity === 0).length,
            totalValue: items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0)
        };

        res.json({
            success: true,
            items,
            summary
        });
    } catch (error) {
        console.error('Dashboard fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data',
            error: error.message
        });
    }
});

// Get all inventory items
router.get('/', authenticateToken, async (req, res) => {
    try {
        console.log('GET /api/inventory - Starting request');
        
        // Check MongoDB connection
        if (Inventory.db.readyState !== 1) {
            console.error('MongoDB not connected. Current state:', Inventory.db.readyState);
            return res.status(500).json({
                success: false,
                message: 'Database connection not ready'
            });
        }

        console.log('MongoDB connected, fetching inventory...');
        
        // Add category filter if provided
        const filter = {};
        if (req.query.category) {
            filter.category = req.query.category;
        }
        
        // Fetch inventory with error handling
        let inventory;
        try {
            inventory = await Inventory.find(filter)
                .select('name description sku category quantity minQuantity price supplier location lastRestocked')
                .sort({ createdAt: -1 })
                .lean()
                .exec();
            
            console.log(`Found ${inventory ? inventory.length : 0} inventory items`);
        } catch (dbError) {
            console.error('Database query error:', dbError);
            return res.status(500).json({
                success: false,
                message: 'Database query failed',
                error: dbError.message
            });
        }

        // Transform data for dashboard with validation
        const dashboardData = {
            success: true,
            items: inventory.map(item => ({
                id: item._id?.toString(),
                name: item.name || 'Unnamed Item',
                sku: item.sku || 'No SKU',
                quantity: Number(item.quantity) || 0,
                minQuantity: Number(item.minQuantity) || 0,
                price: Number(item.price) || 0,
                category: item.category || 'Uncategorized',
                location: item.location || 'Unknown',
                supplier: item.supplier || {},
                description: item.description || '',
                lastRestocked: item.lastRestocked
            })),
            summary: {
                totalItems: inventory.length,
                lowStock: inventory.filter(item => item.quantity <= item.minQuantity).length,
                outOfStock: inventory.filter(item => item.quantity === 0).length,
                totalValue: inventory.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.price)), 0)
            }
        };

        res.status(200).json(dashboardData);
    } catch (error) {
        console.error('Error in inventory route:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch inventory data',
            error: error.message
        });
    }
});

// Get a single inventory item
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const item = await Inventory.findById(req.params.id);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }
        res.json({
            success: true,
            item
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching item',
            error: error.message
        });
    }
});

// Create new inventory item
router.post('/', authenticateToken, async (req, res) => {
    try {
        const newItem = new Inventory(req.body);
        await newItem.validate(); // Validate before saving
        const savedItem = await newItem.save();
        
        // Check if quantity is below minQuantity
        if (savedItem.quantity <= savedItem.minQuantity) {
            // In a real application, you would implement notification logic here
            console.log(`Low stock alert for ${savedItem.name}: ${savedItem.quantity} units remaining`);
        }
        
        res.status(201).json({
            success: true,
            item: savedItem
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating item',
            error: error.message
        });
    }
});

// Update inventory item
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const updatedItem = await Inventory.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!updatedItem) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }
        
        // Check for low stock after update
        if (updatedItem.quantity <= updatedItem.minQuantity) {
            console.log(`Low stock alert for ${updatedItem.name}: ${updatedItem.quantity} units remaining`);
        }
        
        res.json({
            success: true,
            item: updatedItem
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating item',
            error: error.message
        });
    }
});

// Delete inventory item
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const deletedItem = await Inventory.findByIdAndDelete(req.params.id);
        if (!deletedItem) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }
        res.json({
            success: true,
            message: 'Item deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting item',
            error: error.message
        });
    }
});

// Update stock quantity
router.patch('/:id/quantity', authenticateToken, async (req, res) => {
    try {
        const { quantity } = req.body;
        if (typeof quantity !== 'number' || quantity < 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid quantity value'
            });
        }

        const item = await Inventory.findById(req.params.id);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        item.quantity = quantity;
        item.lastRestocked = Date.now();
        await item.save();

        // Check for low stock
        if (item.quantity <= item.minQuantity) {
            console.log(`Low stock alert for ${item.name}: ${item.quantity} units remaining`);
        }

        res.json({
            success: true,
            item
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error updating quantity',
            error: error.message
        });
    }
});

// Generate barcode
router.post('/generate-barcode', authenticateToken, async (req, res) => {
    try {
        const { text, type = 'CODE128', scale = 3, height = 10 } = req.body;

        if (!text) {
            return res.status(400).json({
                success: false,
                message: 'Barcode text is required'
            });
        }

        const png = await new Promise((resolve, reject) => {
            bwipjs.toBuffer({
                bcid: type.toLowerCase(),
                text: text,
                scale: scale,
                height: height,
                includetext: true,
                textxalign: 'center',
            }, (err, png) => {
                if (err) reject(err);
                else resolve(png);
            });
        });

        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': png.length
        });
        res.end(png);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error generating barcode',
            error: error.message
        });
    }
});

// Lookup by barcode
router.get('/barcode/:barcode', authenticateToken, async (req, res) => {
    try {
        const item = await Inventory.findOne({ barcode: req.params.barcode })
            .populate('category')
            .lean();

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found'
            });
        }

        res.json({
            success: true,
            item
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error looking up item',
            error: error.message
        });
    }
});

// Bulk import with validation and error reporting
router.post('/bulk/import', authenticateToken, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No file uploaded'
        });
    }

    const results = {
        success: [],
        errors: []
    };

    try {
        const items = [];
        await new Promise((resolve, reject) => {
            fs.createReadStream(req.file.path)
                .pipe(csv())
                .on('data', (row) => {
                    items.push(row);
                })
                .on('end', resolve)
                .on('error', reject);
        });

        for (const item of items) {
            try {
                // Find or create category
                let category = await Category.findOne({ name: item.category });
                if (!category) {
                    category = await Category.create({ name: item.category });
                }

                // Prepare item data
                const itemData = {
                    name: item.name,
                    description: item.description,
                    sku: item.sku,
                    barcode: item.barcode,
                    category: category._id,
                    brand: item.brand,
                    quantity: Number(item.quantity) || 0,
                    minQuantity: Number(item.minQuantity) || 0,
                    price: Number(item.price) || 0,
                    cost: Number(item.cost) || 0,
                    supplier: {
                        name: item.supplierName,
                        contact: item.supplierContact,
                        email: item.supplierEmail,
                        phone: item.supplierPhone,
                        address: item.supplierAddress
                    },
                    location: item.location,
                    status: item.status || 'active'
                };

                // Create or update item
                const existingItem = await Inventory.findOne({ sku: item.sku });
                if (existingItem) {
                    await Inventory.findByIdAndUpdate(existingItem._id, itemData);
                    results.success.push({ sku: item.sku, message: 'Updated' });
                } else {
                    await Inventory.create(itemData);
                    results.success.push({ sku: item.sku, message: 'Created' });
                }
            } catch (error) {
                results.errors.push({
                    sku: item.sku,
                    error: error.message
                });
            }
        }

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.json({
            success: true,
            results
        });
    } catch (error) {
        // Clean up uploaded file
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            message: 'Error processing file',
            error: error.message
        });
    }
});

// Export inventory to CSV
router.get('/bulk/export', authenticateToken, async (req, res) => {
    try {
        const inventory = await Inventory.find().lean();

        const csvStringifier = createCsvStringifier({
            header: [
                {id: 'name', title: 'Name'},
                {id: 'sku', title: 'SKU'},
                {id: 'category', title: 'Category'},
                {id: 'description', title: 'Description'},
                {id: 'quantity', title: 'Quantity'},
                {id: 'minQuantity', title: 'Min Quantity'},
                {id: 'price', title: 'Price'},
                {id: 'location', title: 'Location'},
                {id: 'supplier.name', title: 'Supplier Name'},
                {id: 'supplier.contact', title: 'Supplier Contact'},
                {id: 'supplier.email', title: 'Supplier Email'}
            ]
        });

        const records = inventory.map(item => ({
            name: item.name,
            sku: item.sku,
            category: item.category,
            description: item.description,
            quantity: item.quantity,
            minQuantity: item.minQuantity,
            price: item.price,
            location: item.location,
            'supplier.name': item.supplier?.name,
            'supplier.contact': item.supplier?.contact,
            'supplier.email': item.supplier?.email
        }));

        const csvContent = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=inventory.csv');
        res.send(csvContent);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error exporting inventory',
            error: error.message
        });
    }
});

module.exports = router;
