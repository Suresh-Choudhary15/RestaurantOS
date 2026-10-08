const { StatusCodes } = require('http-status-codes');
const prisma = require('../lib/prisma');
const { AppError } = require('../middleware/errorHandler');

// Categories
async function getCategories(req, res, next) {
  try {
    const categories = await prisma.menuCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return res.status(StatusCodes.OK).json({ status: 'success', data: { categories } });
  } catch (err) { next(err); }
}

async function createCategory(req, res, next) {
  try {
    const category = await prisma.menuCategory.create({ data: req.body });
    return res.status(StatusCodes.CREATED).json({ status: 'success', data: { category } });
  } catch (err) { next(err); }
}

async function updateCategory(req, res, next) {
  try {
    const category = await prisma.menuCategory.update({
      where: { id: req.params.id },
      data: req.body,
    });
    return res.status(StatusCodes.OK).json({ status: 'success', data: { category } });
  } catch (err) { next(err); }
}

// Menu Items
async function getMenuItems(req, res, next) {
  try {
    const items = await prisma.menuItem.findMany({
      include: { category: true },
    });
    return res.status(StatusCodes.OK).json({ status: 'success', data: { items } });
  } catch (err) { next(err); }
}

async function createMenuItem(req, res, next) {
  try {
    const item = await prisma.menuItem.create({ data: req.body });
    return res.status(StatusCodes.CREATED).json({ status: 'success', data: { item } });
  } catch (err) { next(err); }
}

async function updateMenuItem(req, res, next) {
  try {
    const item = await prisma.menuItem.update({
      where: { id: req.params.id },
      data: req.body,
    });
    return res.status(StatusCodes.OK).json({ status: 'success', data: { item } });
  } catch (err) { next(err); }
}

async function deleteMenuItem(req, res, next) {
  try {
    await prisma.menuItem.delete({ where: { id: req.params.id } });
    return res.status(StatusCodes.OK).json({ status: 'success', message: 'Item deleted' });
  } catch (err) { next(err); }
}

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
