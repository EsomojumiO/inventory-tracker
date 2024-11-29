const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../db');

const createDefaultUsers = async () => {
    try {
        // First connect to the database
        await connectDB();
        
        // Check if users already exist
        const adminExists = await User.findOne({ username: 'admin@thedigitplus.com' });
        const userExists = await User.findOne({ username: 'user@thedigitplus.com' });
        
        if (adminExists || userExists) {
            console.log('Users already exist in the database');
            return;
        }

        // Create admin user
        const adminUser = new User({
            username: 'admin@thedigitplus.com',
            password: 'Admin@123',
            role: 'admin'
        });

        // Create regular user
        const regularUser = new User({
            username: 'user@thedigitplus.com',
            password: 'User@123',
            role: 'user'
        });

        // Save users
        await Promise.all([
            adminUser.save(),
            regularUser.save()
        ]);

        console.log('Default users created successfully:');
        console.log('Admin - admin@thedigitplus.com / Admin@123');
        console.log('User - user@thedigitplus.com / User@123');

    } catch (error) {
        console.error('Error creating default users:', error);
    } finally {
        // Close the connection
        await mongoose.connection.close();
        process.exit(0);
    }
};

// Run the function
createDefaultUsers();
