const { z } = require('zod');

const OrderStatusEnum = z.enum(['PENDING', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED']);
const OrderItemStatusEnum = z.enum(['PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED']);

const createOrderSchema = {
  body: z.object({
    tableId: z.string().uuid('Invalid table ID'),
    waiterId: z.string().uuid('Invalid waiter ID'),
    status: OrderStatusEnum.optional().default('PENDING'),
    notes: z.string().optional(),
    items: z.array(z.object({
      menuItemId: z.string().uuid('Invalid menu item ID'),
      quantity: z.number().int().positive(),
      notes: z.string().optional(),
    })).min(1, 'At least one item is required'),
  }),
};

const updateOrderSchema = {
  params: z.object({
    id: z.string().uuid('Invalid order ID'),
  }),
  body: z.object({
    status: OrderStatusEnum.optional(),
    notes: z.string().optional(),
  }),
};

const updateOrderItemSchema = {
  params: z.object({
    id: z.string().uuid('Invalid order item ID'),
  }),
  body: z.object({
    status: OrderItemStatusEnum.optional(),
    notes: z.string().optional(),
  }),
};

const orderIdParamSchema = {
  params: z.object({
    id: z.string().uuid('Invalid order ID'),
  }),
};

const queryOrdersSchema = {
  query: z.object({
    status: OrderStatusEnum.optional(),
    tableId: z.string().uuid().optional(),
    waiterId: z.string().uuid().optional(),
  }),
};

module.exports = {
  createOrderSchema,
  updateOrderSchema,
  updateOrderItemSchema,
  orderIdParamSchema,
  queryOrdersSchema,
};
