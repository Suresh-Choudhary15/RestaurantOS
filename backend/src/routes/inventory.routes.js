const express = require('express');
const { authenticate, requirePermission } = require('../middleware/auth');
const { audit } = require('../middleware/audit');
const { validate } = require('../middleware/validate');
const inventoryController = require('../controllers/inventory.controller');
const {
  createIngredientSchema,
  updateIngredientSchema,
  ingredientIdParamSchema,
} = require('../validators/inventory.validator');

const router = express.Router();

router.use(authenticate);

router.get('/', requirePermission('read', 'inventory'), audit('ingredients', { action: 'READ' }), inventoryController.getIngredients);
router.post('/', requirePermission('create', 'inventory'), validate(createIngredientSchema), audit('ingredients', { action: 'CREATE' }), inventoryController.createIngredient);
router.put('/:id', requirePermission('update', 'inventory'), validate(updateIngredientSchema), audit('ingredients', { action: 'UPDATE' }), inventoryController.updateIngredient);
router.delete('/:id', requirePermission('delete', 'inventory'), validate(ingredientIdParamSchema), audit('ingredients', { action: 'DELETE' }), inventoryController.deleteIngredient);

module.exports = router;
