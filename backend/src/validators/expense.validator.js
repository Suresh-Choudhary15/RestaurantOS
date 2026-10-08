const { z } = require('zod');

const createExpenseSchema = {
  body: z.object({
    category: z.string().min(1, 'Category is required'),
    description: z.string().min(1, 'Description is required'),
    amount: z.number().positive(),
    date: z.string().datetime(),
    supplierId: z.string().uuid().nullable().optional(),
    receiptUrl: z.string().url().nullable().optional(),
    createdById: z.string().uuid(),
  }),
};

const updateExpenseSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    category: z.string().optional(),
    description: z.string().optional(),
    amount: z.number().positive().optional(),
    date: z.string().datetime().optional(),
    supplierId: z.string().uuid().nullable().optional(),
    receiptUrl: z.string().url().nullable().optional(),
  }),
};

const expenseIdParamSchema = {
  params: z.object({ id: z.string().uuid() }),
};

module.exports = {
  createExpenseSchema,
  updateExpenseSchema,
  expenseIdParamSchema,
};
