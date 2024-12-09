const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const supplierController = require('../controllers/supplierController');

// Get all suppliers
router.get('/', 
    authenticate,
    supplierController.getSuppliers);

// Get single supplier
router.get('/:id', 
    authenticate,
    supplierController.getSupplierById);

// Create new supplier
router.post('/', 
    authenticate,
    supplierController.createSupplier);

// Update supplier
router.put('/:id', 
    authenticate,
    supplierController.updateSupplier);

// Delete supplier
router.delete('/:id', 
    authenticate,
    supplierController.deleteSupplier);

// Update supplier status
router.patch('/:id/status', 
    authenticate,
    supplierController.updateSupplierStatus);

// Update supplier credit
router.patch('/:id/credit',
    authenticate,
    async (req, res) => {
        try {
            const { creditLimit } = req.body;
            
            if (typeof creditLimit !== 'number' || creditLimit < 0) {
                return res.status(400).json({ error: 'Invalid credit limit' });
            }

            const supplier = await Supplier.findByIdAndUpdate(
                req.params.id,
                { creditLimit },
                { new: true }
            );

            if (!supplier) {
                return res.status(404).json({ error: 'Supplier not found' });
            }

            res.json(supplier);
        } catch (error) {
            res.status(500).json({ error: 'Error updating supplier credit' });
        }
    }
);

module.exports = router;
