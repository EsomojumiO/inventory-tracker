const express = require('express');
const Item = require('../models/Item');
const router = express.Router();

// Get all items
router.get('/', async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching items' });
  }
});

// Add a new item
router.post('/', async (req, res) => {
  const { name, category, quantity, price, description } = req.body;

  try {
    const newItem = new Item({
      name,
      category,
      quantity,
      price,
      description
    });
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (err) {
    res.status(400).json({ message: 'Error adding item' });
  }
});

module.exports = router;
