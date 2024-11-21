const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors'); // CORS for cross-origin requests
const itemRoutes = require('./routes/item');
const authRoutes = require('./routes/auth');

const app = express();

// Middleware
app.use(cors()); // Enable CORS
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/inventoryDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/items', itemRoutes); // Items route
app.use('/api/auth', authRoutes); // Auth route

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});