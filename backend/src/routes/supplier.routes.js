const express = require('express');
const { authenticate, requirePermission } = require('../middleware/auth');
const { audit } = require('../middleware/audit');
const { validate } = require('../middleware/validate');
const supplierController = require('../controllers/supplier.controller');
const {
  createSupplierSchema,
  updateSupplierSchema,
  supplierIdParamSchema,
} = require('../validators/supplier.validator');

const router = express.Router();

router.use(authenticate);

router.get('/', requirePermission('read', 'suppliers'), audit('suppliers', { action: 'READ' }), supplierController.getSuppliers);
router.post('/', requirePermission('create', 'suppliers'), validate(createSupplierSchema), audit('suppliers', { action: 'CREATE' }), supplierController.createSupplier);
router.put('/:id', requirePermission('update', 'suppliers'), validate(updateSupplierSchema), audit('suppliers', { action: 'UPDATE' }), supplierController.updateSupplier);
router.delete('/:id', requirePermission('delete', 'suppliers'), validate(supplierIdParamSchema), audit('suppliers', { action: 'DELETE' }), supplierController.deleteSupplier);

module.exports = router;
