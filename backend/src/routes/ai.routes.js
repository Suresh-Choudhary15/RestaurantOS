const express = require('express');
const { authenticate, requirePermission } = require('../middleware/auth');
const { audit } = require('../middleware/audit');
const aiController = require('../controllers/ai.controller');

const router = express.Router();

router.use(authenticate);

router.post(
  '/process-invoice',
  requirePermission('create', 'expenses'),
  audit('supplier_invoices', { action: 'CREATE' }),
  aiController.processInvoice
);

module.exports = router;
