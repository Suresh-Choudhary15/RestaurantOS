const express = require('express');
const { authenticate, requirePermission } = require('../middleware/auth');
const { audit } = require('../middleware/audit');
const { validate } = require('../middleware/validate');
const orderController = require('../controllers/order.controller');
const {
  createOrderSchema,
  updateOrderSchema,
  updateOrderItemSchema,
  orderIdParamSchema,
  queryOrdersSchema,
} = require('../validators/order.validator');

const router = express.Router();

router.use(authenticate);

router.get('/', requirePermission('read', 'orders'), validate(queryOrdersSchema), audit('orders', { action: 'READ' }), orderController.getAllOrders);
router.get('/:id', requirePermission('read', 'orders'), validate(orderIdParamSchema), audit('orders', { action: 'READ' }), orderController.getOrderById);
router.post('/', requirePermission('create', 'orders'), validate(createOrderSchema), audit('orders', { action: 'CREATE' }), orderController.createOrder);
router.put('/:id', requirePermission('update', 'orders'), validate(updateOrderSchema), audit('orders', { action: 'UPDATE' }), orderController.updateOrder);
router.delete('/:id', requirePermission('delete', 'orders'), validate(orderIdParamSchema), audit('orders', { action: 'DELETE' }), orderController.deleteOrder);

// Order Items
router.put('/items/:id', requirePermission('update', 'orders'), validate(updateOrderItemSchema), audit('order_items', { action: 'UPDATE' }), orderController.updateOrderItem);

module.exports = router;
