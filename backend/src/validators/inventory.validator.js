const { z } = require('zod');

const createIngredientSchema = {
  body: z.object({
    name: z.string().min(1, 'Ingredient name is required'),
    unit: z.string().min(1, 'Unit is required'),
    currentStock: z.number().nonnegative().optional().default(0),
    reorderLevel: z.number().nonnegative().optional().default(0),
    costPerUnit: z.number().nonnegative().optional().default(0),
    supplierId: z.string().uuid('Invalid supplier ID').nullable().optional(),
  }),
};

const updateIngredientSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().optional(),
    unit: z.string().optional(),
    currentStock: z.number().nonnegative().optional(),
    reorderLevel: z.number().nonnegative().optional(),
    costPerUnit: z.number().nonnegative().optional(),
    supplierId: z.string().uuid().nullable().optional(),
  }),
};

const ingredientIdParamSchema = {
  params: z.object({ id: z.string().uuid() }),
};

module.exports = {
  createIngredientSchema,
  updateIngredientSchema,
  ingredientIdParamSchema,
};
