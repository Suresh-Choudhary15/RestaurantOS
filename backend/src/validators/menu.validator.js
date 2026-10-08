const { z } = require('zod');

const createCategorySchema = {
  body: z.object({
    name: z.string().min(1, 'Category name is required'),
    description: z.string().optional(),
    sortOrder: z.number().int().optional(),
    isActive: z.boolean().optional().default(true),
  }),
};

const updateCategorySchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    sortOrder: z.number().int().optional(),
    isActive: z.boolean().optional(),
  }),
};

const createMenuItemSchema = {
  body: z.object({
    name: z.string().min(1, 'Item name is required'),
    description: z.string().optional(),
    price: z.number().positive(),
    categoryId: z.string().uuid('Invalid category ID'),
    imageUrl: z.string().url().optional().nullable(),
    isAvailable: z.boolean().optional().default(true),
    prepTime: z.number().int().nonnegative().optional(),
  }),
};

const updateMenuItemSchema = {
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
    categoryId: z.string().uuid().optional(),
    imageUrl: z.string().url().optional().nullable(),
    isAvailable: z.boolean().optional(),
    prepTime: z.number().int().nonnegative().optional(),
  }),
};

const menuIdParamSchema = {
  params: z.object({ id: z.string().uuid() }),
};

module.exports = {
  createCategorySchema,
  updateCategorySchema,
  createMenuItemSchema,
  updateMenuItemSchema,
  menuIdParamSchema,
};
