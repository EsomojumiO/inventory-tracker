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

module.exports = router;