const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        unique: true,
        trim: true
    },
    code: {
        type: String,
        required: [true, 'Category code is required'],
        unique: true,
        uppercase: true,
        trim: true,
        minlength: 2,
        maxlength: 5
    },
    description: {
        type: String,
        trim: true
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    defaultTaxRate: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    defaultMargin: {
        type: Number,
        min: 0,
        default: 0
    },
    attributes: [{
        name: String,
        type: {
            type: String,
            enum: ['text', 'number', 'boolean', 'date', 'select'],
            default: 'text'
        },
        required: Boolean,
        defaultValue: mongoose.Schema.Types.Mixed,
        options: [String], // For select type
        validation: {
            min: Number,
            max: Number,
            pattern: String
        }
    }],
    metadata: {
        type: Map,
        of: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes
categorySchema.index({ name: 1 });
categorySchema.index({ code: 1 });
categorySchema.index({ parent: 1 });
categorySchema.index({ isActive: 1 });

// Virtual for path
categorySchema.virtual('path').get(function() {
    return this.parent ? `${this.parent.path}/${this.name}` : this.name;
});

// Virtual for full path with codes
categorySchema.virtual('codePath').get(function() {
    return this.parent ? `${this.parent.codePath}/${this.code}` : this.code;
});

// Pre-save middleware
categorySchema.pre('save', async function(next) {
    if (!this.code) {
        // Generate code from name if not provided
        this.code = this.name
            .substring(0, 5)
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '');
    }
    next();
});

// Methods
categorySchema.methods = {
    async getProducts(options = {}) {
        return mongoose.model('Product')
            .find({ category: this._id, ...options })
            .sort({ name: 1 });
    },

    async getSubcategories(options = {}) {
        return this.model('Category')
            .find({ parent: this._id, ...options })
            .sort({ name: 1 });
    },

    async getAncestors() {
        const ancestors = [];
        let currentParent = this.parent;

        while (currentParent) {
            const parent = await this.model('Category').findById(currentParent);
            if (!parent) break;
            ancestors.unshift(parent);
            currentParent = parent.parent;
        }

        return ancestors;
    },

    async getDescendants() {
        const descendants = [];
        const queue = [this._id];

        while (queue.length > 0) {
            const parentId = queue.shift();
            const children = await this.model('Category')
                .find({ parent: parentId })
                .select('_id name code parent');

            descendants.push(...children);
            queue.push(...children.map(child => child._id));
        }

        return descendants;
    }
};

// Static methods
categorySchema.statics = {
    async getRootCategories() {
        return this.find({ parent: null })
            .sort({ name: 1 });
    },

    async getCategoryTree() {
        const categories = await this.find({})
            .sort({ name: 1 });

        const categoryMap = new Map();
        const rootCategories = [];

        // Create a map of categories
        categories.forEach(category => {
            categoryMap.set(category._id.toString(), {
                ...category.toObject(),
                children: []
            });
        });

        // Build the tree structure
        categories.forEach(category => {
            const categoryObj = categoryMap.get(category._id.toString());
            if (category.parent) {
                const parent = categoryMap.get(category.parent.toString());
                if (parent) {
                    parent.children.push(categoryObj);
                }
            } else {
                rootCategories.push(categoryObj);
            }
        });

        return rootCategories;
    }
};

module.exports = mongoose.model('Category', categorySchema);
