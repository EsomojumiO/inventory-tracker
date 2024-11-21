const express = require('express');
const router = express.Router();
const Item = require('../models/Item'); // Item model

// Get all items
router.get('/', async (req, res) => {
    try {
        const items = await Item.find(); // Fetch all items from the DB
        res.json(items); // Return items as JSON
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Add a new item (POST request)
router.post('/', async (req, res) => {
    const { name, category, quantity, price, description } = req.body;

    try {
        // Validate that all required fields are present
        if (!name || !category || !quantity || !price || !description) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Create a new item and save it to the database
        const newItem = new Item({
            name,
            category,
            quantity,
            price,
            description
        });

        const savedItem = await newItem.save(); // Save item to MongoDB
        res.status(201).json(savedItem); // Return the saved item in response
    } catch (error) {
        console.error('Error adding item:', error);
        res.status(500).json({ message: 'Error adding item' }); // Handle server error
    }
});

// Edit an item (PUT request)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, category, quantity, price, description } = req.body;

    try {
        // Find the item by ID and update it
        const updatedItem = await Item.findByIdAndUpdate(id, {
            name,
            category,
            quantity,
            price,
            description
        }, { new: true });

        if (!updatedItem) {
            return res.status(404).json({ message: 'Item not found' });
        }

        res.json(updatedItem); // Return the updated item in the response
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ message: 'Error updating item' });
    }

});

// DELETE route to remove an item
router.delete('/delete/:id', async (req, res) => {
    try {
        const itemId = req.params.id;
        const item = await Item.findByIdAndDelete(itemId);

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        res.status(200).json({ message: 'Item deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});


module.exports = router;