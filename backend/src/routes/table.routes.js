const express = require('express');
const { StatusCodes } = require('http-status-codes');
const { authenticate, requirePermission } = require('../middleware/auth');
const { audit } = require('../middleware/audit');
const { validate } = require('../middleware/validate');
const tableController = require('../controllers/table.controller');
const {
  createTableSchema,
  updateTableSchema,
  tableIdParamSchema,
  queryTablesSchema,
} = require('../validators/table.validator');

const router = express.Router();

router.use(authenticate);

router.get(
  '/',
  requirePermission('read', 'tables'),
  validate(queryTablesSchema),
  audit('tables', { action: 'READ' }),
  tableController.getAllTables,
);

router.get(
  '/:id',
  requirePermission('read', 'tables'),
  validate(tableIdParamSchema),
  audit('tables', { action: 'READ' }),
  tableController.getTableById,
);

router.post(
  '/',
  requirePermission('create', 'tables'),
  validate(createTableSchema),
  audit('tables', { action: 'CREATE' }),
  tableController.createTable,
);

router.put(
  '/:id',
  requirePermission('update', 'tables'),
  validate(updateTableSchema),
  audit('tables', { action: 'UPDATE' }),
  tableController.updateTable,
);

router.delete(
  '/:id',
  requirePermission('delete', 'tables'),
  validate(tableIdParamSchema),
  audit('tables', { action: 'DELETE' }),
  tableController.deleteTable,
);

module.exports = router;
