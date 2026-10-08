const { z } = require('zod');

const createSupplierSchema = {
  body: z.object({
    name: z.string().min(1, 'Supplier name is required'),
    contactPerson: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    isActive: z.boolean().optional().default(true),
  }),
};

const updateSupplierSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().optional(),
    contactPerson: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
};

const supplierIdParamSchema = {
  params: z.object({ id: z.string().uuid() }),
};

module.exports = {
  createSupplierSchema,
  updateSupplierSchema,
  supplierIdParamSchema,
};
