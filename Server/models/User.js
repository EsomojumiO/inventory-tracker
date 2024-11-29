const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const ROLES = {
    ADMIN: 'admin',
    USER: 'user',
    STAFF: 'staff'
};

const PERMISSIONS = {
    [ROLES.ADMIN]: [
        'manage_users',
        'view_inventory',
        'manage_inventory',
        'view_sales',
        'manage_sales',
        'view_reports',
        'manage_settings'
    ],
    [ROLES.STAFF]: [
        'view_inventory',
        'manage_inventory',
        'view_sales',
        'manage_sales'
    ],
    [ROLES.USER]: [
        'view_inventory',
        'view_sales'
    ]
};

const userSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [20, 'Username cannot exceed 20 characters'],
        match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
    },
    password: { 
        type: String, 
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false, 
        validate: {
            validator: function(password) {
                return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/.test(password);
            },
            message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        }
    },
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
        match: [/^\+?[\d\s-]{10,}$/, 'Please enter a valid phone number']
    },
    businessName: {
        type: String,
        required: [true, 'Business name is required'],
        trim: true
    },
    google: {
        id: String,
        email: String
    },
    apple: {
        id: String,
        email: String
    },
    role: { 
        type: String, 
        enum: {
            values: Object.values(ROLES),
            message: 'Invalid role'
        },
        default: ROLES.USER
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Update timestamp on save
userSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Error comparing passwords');
    }
};

// Get user permissions
userSchema.methods.getPermissions = function() {
    return PERMISSIONS[this.role] || [];
};

// Check if user has permission
userSchema.methods.hasPermission = function(permission) {
    const permissions = this.getPermissions();
    return permissions.includes(permission);
};

// Check if user is admin
userSchema.methods.isAdmin = function() {
    return this.role === ROLES.ADMIN;
};

// Increment login attempts
userSchema.methods.incrementLoginAttempts = async function() {
    // If lock has expired, reset attempts and remove lock
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1 }
        });
    }

    // Otherwise, increment attempts
    const updates = { $inc: { loginAttempts: 1 } };
    
    // Lock the account if we've reached max attempts
    if (this.loginAttempts + 1 >= 5 && !this.lockUntil) {
        updates.$set = { lockUntil: Date.now() + 5 * 60 * 1000 }; // 5 minutes
    }

    return this.updateOne(updates);
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $set: { loginAttempts: 0 },
        $unset: { lockUntil: 1 }
    });
};

module.exports = {
    User: mongoose.model('User', userSchema),
    ROLES,
    PERMISSIONS
};