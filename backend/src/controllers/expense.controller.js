const { StatusCodes } = require('http-status-codes');
const prisma = require('../lib/prisma');
const { AppError } = require('../middleware/errorHandler');

async function getExpenses(req, res, next) {
  try {
    const expenses = await prisma.expense.findMany({
      include: { supplier: true, createdBy: true },
    });
    return res.status(StatusCodes.OK).json({ status: 'success', data: { expenses } });
  } catch (err) { next(err); }
}

async function createExpense(req, res, next) {
  try {
    const expense = await prisma.expense.create({ data: req.body });
    return res.status(StatusCodes.CREATED).json({ status: 'success', data: { expense } });
  } catch (err) { next(err); }
}

async function updateExpense(req, res, next) {
  try {
    const expense = await prisma.expense.update({
      where: { id: req.params.id },
      data: req.body,
    });
    return res.status(StatusCodes.OK).json({ status: 'success', data: { expense } });
  } catch (err) { next(err); }
}

async function deleteExpense(req, res, next) {
  try {
    await prisma.expense.delete({ where: { id: req.params.id } });
    return res.status(StatusCodes.OK).json({ status: 'success', message: 'Expense deleted' });
  } catch (err) { next(err); }
}

module.exports = {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
};
