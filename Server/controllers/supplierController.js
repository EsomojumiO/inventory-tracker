const Supplier = require('../models/Supplier');
const ApiError = require('../utils/ApiError');

// Get all suppliers
exports.getSuppliers = async (req, res) => {
    try {
        const { 
            search, 
            status, 
            category,
            sort = 'name',
            order = 'asc',
            page = 1,
            limit = 10
        } = req.query;

        // Build query
        const query = { organizationId: req.user.organizationId };
        if (search) {
            query.$or = [
                { name: new RegExp(search, 'i') },
                { code: new RegExp(search, 'i') },
                { email: new RegExp(search, 'i') }
            ];
        }
        if (status) query.status = status;
        if (category) query.categories = category;

        // Execute query with pagination
        const suppliers = await Supplier.find(query)
            .sort({ [sort]: order === 'asc' ? 1 : -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('categories');

        // Get total count for pagination
        const total = await Supplier.countDocuments(query);

        res.json({
            suppliers,
            total,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        throw new ApiError('Error fetching suppliers', 500);
    }
};

// Get supplier by ID
exports.getSupplierById = async (req, res) => {
    try {
        const supplier = await Supplier.findOne({
            _id: req.params.id,
            organizationId: req.user.organizationId
        }).populate('categories');
        
        if (!supplier) {
            throw new ApiError('Supplier not found', 404);
        }
        
        res.json(supplier);
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError('Error fetching supplier', 500);
    }
};

// Create new supplier
exports.createSupplier = async (req, res) => {
    try {
        const supplier = new Supplier({
            ...req.body,
            organizationId: req.user.organizationId
        });
        await supplier.save();
        res.status(201).json(supplier);
    } catch (error) {
        if (error.code === 11000) {
            throw new ApiError('A supplier with this code or email already exists', 400);
        }
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            throw new ApiError(messages.join(', '), 400);
        }
        throw new ApiError('Error creating supplier', 500);
    }
};

// Update supplier
exports.updateSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findOneAndUpdate(
            {
                _id: req.params.id,
                organizationId: req.user.organizationId
            },
            req.body,
            { new: true, runValidators: true }
        );

        if (!supplier) {
            throw new ApiError('Supplier not found', 404);
        }

        res.json(supplier);
    } catch (error) {
        if (error.code === 11000) {
            throw new ApiError('Supplier with this code or email already exists', 400);
        }
        if (error instanceof ApiError) throw error;
        throw new ApiError('Error updating supplier', 500);
    }
};

// Delete supplier
exports.deleteSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findOneAndDelete({
            _id: req.params.id,
            organizationId: req.user.organizationId
        });
        
        if (!supplier) {
            throw new ApiError('Supplier not found', 404);
        }

        res.json({ message: 'Supplier deleted successfully' });
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError('Error deleting supplier', 500);
    }
};

// Update supplier status
exports.updateSupplierStatus = async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!['ACTIVE', 'INACTIVE', 'BLOCKED'].includes(status)) {
            throw new ApiError('Invalid status', 400);
        }

        const supplier = await Supplier.findOneAndUpdate(
            {
                _id: req.params.id,
                organizationId: req.user.organizationId
            },
            { status },
            { new: true }
        );

        if (!supplier) {
            throw new ApiError('Supplier not found', 404);
        }

        res.json(supplier);
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError('Error updating supplier status', 500);
    }
};
