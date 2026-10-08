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

module.exports = {
  getIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
};
