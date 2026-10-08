const express = require('express');
const { authenticate, requirePermission } = require('../middleware/auth');
const { audit } = require('../middleware/audit');
const { validate } = require('../middleware/validate');
const expenseController = require('../controllers/expense.controller');
const {
  createExpenseSchema,
  updateExpenseSchema,
  expenseIdParamSchema,
} = require('../validators/expense.validator');

const router = express.Router();

router.use(authenticate);

router.get('/', requirePermission('read', 'expenses'), audit('expenses', { action: 'READ' }), expenseController.getExpenses);
router.get('/export', requirePermission('read', 'expenses'), audit('expenses', { action: 'EXPORT' }), expenseController.exportExpenses);
router.post('/', requirePermission('create', 'expenses'), validate(createExpenseSchema), audit('expenses', { action: 'CREATE' }), expenseController.createExpense);
router.put('/:id', requirePermission('update', 'expenses'), validate(updateExpenseSchema), audit('expenses', { action: 'UPDATE' }), expenseController.updateExpense);
router.delete('/:id', requirePermission('delete', 'expenses'), validate(expenseIdParamSchema), audit('expenses', { action: 'DELETE' }), expenseController.deleteExpense);

module.exports = router;
