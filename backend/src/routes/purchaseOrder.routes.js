const express = require('express');
const { authenticate, requirePermission } = require('../middleware/auth');
const { audit } = require('../middleware/audit');
const purchaseOrderController = require('../controllers/purchaseOrder.controller');

const router = express.Router();

router.use(authenticate);

// Get all purchase orders
router.get(
  '/',
  requirePermission('read', 'purchase_orders'),
  audit('purchase_orders', { action: 'READ' }),
  purchaseOrderController.getPurchaseOrders
);

// Get purchase order by ID
router.get(
  '/:id',
  requirePermission('read', 'purchase_orders'),
  audit('purchase_orders', { action: 'READ' }),
  purchaseOrderController.getPurchaseOrderById
);

// Create purchase order
router.post(
  '/',
  requirePermission('create', 'purchase_orders'),
  audit('purchase_orders', { action: 'CREATE' }),
  purchaseOrderController.createPurchaseOrder
);

// Update purchase order
router.put(
  '/:id',
  requirePermission('update', 'purchase_orders'),
  audit('purchase_orders', { action: 'UPDATE' }),
  purchaseOrderController.updatePurchaseOrder
);

// Update purchase order status
router.patch(
  '/:id/status',
  requirePermission('update', 'purchase_orders'),
  audit('purchase_orders', { action: 'UPDATE_STATUS' }),
  purchaseOrderController.updatePurchaseOrderStatus
);

// Delete purchase order
router.delete(
  '/:id',
  requirePermission('delete', 'purchase_orders'),
  audit('purchase_orders', { action: 'DELETE' }),
  purchaseOrderController.deletePurchaseOrder
);

module.exports = router;
