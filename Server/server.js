const express = require('express');
const connectDB = require('./db');
const itemRoutes = require('./routes/items');
const cors = require('cors');

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/items', itemRoutes);

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
