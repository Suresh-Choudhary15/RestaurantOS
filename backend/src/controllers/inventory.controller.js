const { StatusCodes } = require('http-status-codes');
const prisma = require('../lib/prisma');
const { AppError } = require('../middleware/errorHandler');
const { emitLowStockAlert } = require('../lib/socket');

async function getIngredients(req, res, next) {
  try {
    const ingredients = await prisma.ingredient.findMany({
      include: { supplier: true },
    });
    return res.status(StatusCodes.OK).json({ status: 'success', data: { ingredients } });
  } catch (err) { next(err); }
}

async function createIngredient(req, res, next) {
  try {
    const ingredient = await prisma.ingredient.create({ data: req.body });
    return res.status(StatusCodes.CREATED).json({ status: 'success', data: { ingredient } });
  } catch (err) { next(err); }
}

async function updateIngredient(req, res, next) {
  try {
    const ingredient = await prisma.ingredient.update({
      where: { id: req.params.id },
      data: req.body,
    });

    // Check if stock is now low and emit alert
    if (Number(ingredient.currentStock) <= Number(ingredient.reorderLevel)) {
      emitLowStockAlert(ingredient);
    }

    return res.status(StatusCodes.OK).json({ status: 'success', data: { ingredient } });
  } catch (err) { next(err); }
}

async function deleteIngredient(req, res, next) {
  try {
    await prisma.ingredient.delete({ where: { id: req.params.id } });
    return res.status(StatusCodes.OK).json({ status: 'success', message: 'Ingredient deleted' });
  } catch (err) { next(err); }
}

async function stockIn(req, res, next) {
  try {
    const { ingredientId, quantity, reason, reference } = req.body;

    if (!ingredientId || !quantity || !reason) {
      throw new AppError('ingredientId, quantity, and reason are required', StatusCodes.BAD_REQUEST);
    }

    const quantityNum = Number(quantity);
    if (!Number.isFinite(quantityNum) || quantityNum <= 0) {
      throw new AppError('Quantity must be greater than 0', StatusCodes.BAD_REQUEST);
    }

    // Use transaction to update stock and create movement atomically
    const result = await prisma.$transaction(async (tx) => {
      // Get current ingredient
      const ingredient = await tx.ingredient.findUnique({
        where: { id: ingredientId },
      });

      if (!ingredient) {
        throw new AppError('Ingredient not found', StatusCodes.NOT_FOUND);
      }

      // Update ingredient stock
      const updatedIngredient = await tx.ingredient.update({
        where: { id: ingredientId },
        data: {
          currentStock: {
            increment: quantityNum,
          },
        },
        include: { supplier: true },
      });

      // Create stock movement record
      const movement = await tx.stockMovement.create({
        data: {
          ingredientId,
          type: 'IN',
          quantity: quantityNum,
          reason,
          reference: reference || null,
          createdById: req.user.id,
        },
        include: {
          ingredient: { select: { name: true, unit: true } },
          createdBy: { select: { firstName: true, lastName: true, role: true } },
        },
      });

      return { ingredient: updatedIngredient, movement };
    });

    return res.status(StatusCodes.OK).json({
      status: 'success',
      data: result,
      message: 'Stock added successfully',
    });
  } catch (err) {
    next(err);
  }
}

async function stockOut(req, res, next) {
  try {
    const { ingredientId, quantity, reason, reference } = req.body;

    if (!ingredientId || !quantity || !reason) {
      throw new AppError('ingredientId, quantity, and reason are required', StatusCodes.BAD_REQUEST);
    }

    const quantityNum = Number(quantity);
    if (!Number.isFinite(quantityNum) || quantityNum <= 0) {
      throw new AppError('Quantity must be greater than 0', StatusCodes.BAD_REQUEST);
    }

    // Use transaction to update stock and create movement atomically
    const result = await prisma.$transaction(async (tx) => {
      // Get current ingredient
      const ingredient = await tx.ingredient.findUnique({
        where: { id: ingredientId },
      });

      if (!ingredient) {
        throw new AppError('Ingredient not found', StatusCodes.NOT_FOUND);
      }

      // Check if we have sufficient stock
      const currentStock = Number(ingredient.currentStock);
      if (currentStock < quantityNum) {
        throw new AppError(
          `Insufficient stock. Current stock: ${currentStock} ${ingredient.unit}, requested: ${quantityNum} ${ingredient.unit}`,
          StatusCodes.BAD_REQUEST
        );
      }

      // Update ingredient stock
      const updatedIngredient = await tx.ingredient.update({
        where: { id: ingredientId },
        data: {
          currentStock: {
            decrement: quantityNum,
          },
        },
        include: { supplier: true },
      });

      // Create stock movement record
      const movement = await tx.stockMovement.create({
        data: {
          ingredientId,
          type: 'OUT',
          quantity: quantityNum,
          reason,
          reference: reference || null,
          createdById: req.user.id,
        },
        include: {
          ingredient: { select: { name: true, unit: true } },
          createdBy: { select: { firstName: true, lastName: true, role: true } },
        },
      });

      // Check if stock is now low and emit alert
      if (Number(updatedIngredient.currentStock) <= Number(updatedIngredient.reorderLevel)) {
        emitLowStockAlert(updatedIngredient);
      }

      return { ingredient: updatedIngredient, movement };
    });

    return res.status(StatusCodes.OK).json({
      status: 'success',
      data: result,
      message: 'Stock removed successfully',
    });
  } catch (err) {
    next(err);
  }
}

async function getStockMovements(req, res, next) {
  try {
    const { ingredientId } = req.query;
    const where = ingredientId ? { ingredientId } : {};

    const movements = await prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        ingredient: { select: { name: true, unit: true } },
        createdBy: { select: { firstName: true, lastName: true, role: true } },
      },
    });

    return res.status(StatusCodes.OK).json({ status: 'success', data: { movements } });
  } catch (err) {
    next(err);
  }
}

async function getIngredientMovements(req, res, next) {
  try {
    const { id } = req.params;

    const movements = await prisma.stockMovement.findMany({
      where: { ingredientId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        ingredient: { select: { name: true, unit: true } },
        createdBy: { select: { firstName: true, lastName: true, role: true } },
      },
    });

    return res.status(StatusCodes.OK).json({ status: 'success', data: { movements } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  stockIn,
  stockOut,
  getStockMovements,
  getIngredientMovements,
};
