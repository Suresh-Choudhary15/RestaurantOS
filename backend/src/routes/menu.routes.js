const express = require('express');
const { authenticate, requirePermission } = require('../middleware/auth');
const { audit } = require('../middleware/audit');
const { validate } = require('../middleware/validate');
const menuController = require('../controllers/menu.controller');
const {
  createCategorySchema,
  updateCategorySchema,
  createMenuItemSchema,
  updateMenuItemSchema,
  menuIdParamSchema,
} = require('../validators/menu.validator');

const router = express.Router();

router.use(authenticate);

// Categories
router.get('/categories', requirePermission('read', 'menu'), audit('menu_categories', { action: 'READ' }), menuController.getCategories);
router.post('/categories', requirePermission('create', 'menu'), validate(createCategorySchema), audit('menu_categories', { action: 'CREATE' }), menuController.createCategory);
router.put('/categories/:id', requirePermission('update', 'menu'), validate(updateCategorySchema), audit('menu_categories', { action: 'UPDATE' }), menuController.updateCategory);

// Items
router.get('/items', requirePermission('read', 'menu'), audit('menu_items', { action: 'READ' }), menuController.getMenuItems);
router.post('/items', requirePermission('create', 'menu'), validate(createMenuItemSchema), audit('menu_items', { action: 'CREATE' }), menuController.createMenuItem);
router.put('/items/:id', requirePermission('update', 'menu'), validate(updateMenuItemSchema), audit('menu_items', { action: 'UPDATE' }), menuController.updateMenuItem);
router.delete('/items/:id', requirePermission('delete', 'menu'), validate(menuIdParamSchema), audit('menu_items', { action: 'DELETE' }), menuController.deleteMenuItem);

module.exports = router;
