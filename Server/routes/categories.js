const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const Category = require('../models/Category');

// Get all categories
router.get('/', authenticateToken, async (req, res) => {
    try {
        const categories = await Category.find()
            .populate('parent')
            .sort('name')
            .lean();
        
        // Organize into hierarchy if requested
        if (req.query.hierarchy === 'true') {
            const hierarchy = categories.reduce((acc, category) => {
                if (!category.parent) {
                    acc[category._id] = { ...category, children: [] };
                } else {
                    const parent = acc[category.parent._id];
                    if (parent) {
                        parent.children.push(category);
                    }
                }
                return acc;
            }, {});
            
            res.json(Object.values(hierarchy));
        } else {
            res.json(categories);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching categories',
            error: error.message
        });
    }
});

// Create new category
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { name, description, parent, attributes } = req.body;

        // Validate parent if provided
        if (parent) {
            const parentExists = await Category.findById(parent);
            if (!parentExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Parent category not found'
                });
            }
        }

        const category = await Category.create({
            name,
            description,
            parent,
            attributes
        });

        res.status(201).json({
            success: true,
            category
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating category',
            error: error.message
        });
    }
});

// Update category
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { name, description, parent, attributes } = req.body;

        // Prevent circular reference
        if (parent === req.params.id) {
            return res.status(400).json({
                success: false,
                message: 'Category cannot be its own parent'
            });
        }

        const category = await Category.findByIdAndUpdate(
            req.params.id,
            { name, description, parent, attributes },
            { new: true, runValidators: true }
        );

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            category
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating category',
            error: error.message
        });
    }
});

// Delete category
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        // Check for child categories
        const hasChildren = await Category.exists({ parent: req.params.id });
        if (hasChildren) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete category with child categories'
            });
        }

        // Check for products using this category
        const Inventory = require('../models/Inventory');
        const hasProducts = await Inventory.exists({ category: req.params.id });
        if (hasProducts) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete category with associated products'
            });
        }

        const category = await Category.findByIdAndDelete(req.params.id);
        
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting category',
            error: error.message
        });
    }
});

// Get category attributes
router.get('/:id/attributes', authenticateToken, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id)
            .select('attributes')
            .lean();

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        res.json({
            success: true,
            attributes: category.attributes || []
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching category attributes',
            error: error.message
        });
    }
});

module.exports = router;
