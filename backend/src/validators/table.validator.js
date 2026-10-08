const { z } = require('zod');

const TableStatusEnum = z.enum(['AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE']);

const createTableSchema = {
  body: z.object({
    number: z.number({ required_error: 'Table number is required' }).int().positive('Table number must be positive'),
    capacity: z.number({ required_error: 'Capacity is required' }).int().positive('Capacity must be positive'),
    status: TableStatusEnum.optional().default('AVAILABLE'),
  }),
};

const updateTableSchema = {
  params: z.object({
    id: z.string().uuid('Invalid table ID format'),
  }),
  body: z.object({
    number: z.number().int().positive().optional(),
    capacity: z.number().int().positive().optional(),
    status: TableStatusEnum.optional(),
    currentOrderId: z.string().uuid('Invalid order ID').nullable().optional(),
  }),
};

const tableIdParamSchema = {
  params: z.object({
    id: z.string().uuid('Invalid table ID format'),
  }),
};

const queryTablesSchema = {
  query: z.object({
    status: TableStatusEnum.optional(),
  }),
};

module.exports = {
  createTableSchema,
  updateTableSchema,
  tableIdParamSchema,
  queryTablesSchema,
};
