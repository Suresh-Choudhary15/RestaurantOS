const { StatusCodes } = require('http-status-codes');
const prisma = require('../lib/prisma');
const { AppError } = require('../middleware/errorHandler');
const XLSX = require('xlsx');

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

async function exportExpenses(req, res, next) {
  try {
    const expenses = await prisma.expense.findMany({
      include: { supplier: true, createdBy: true, supplierInvoice: true },
      orderBy: { date: 'desc' },
    });

    // Transform data for Excel
    const rows = expenses.map((expense) => ({
      Date: expense.date.toISOString().split('T')[0],
      Category: expense.category,
      Description: expense.description,
      Amount: parseFloat(expense.amount),
      Supplier: expense.supplier?.name || 'N/A',
      'Invoice Number': expense.supplierInvoice?.invoiceNumber || '',
      'Created By': `${expense.createdBy.firstName} ${expense.createdBy.lastName}`,
      'Created At': expense.createdAt.toISOString().split('T')[0],
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 12 }, // Date
      { wch: 20 }, // Category
      { wch: 40 }, // Description
      { wch: 12 }, // Amount
      { wch: 25 }, // Supplier
      { wch: 18 }, // Invoice Number
      { wch: 20 }, // Created By
      { wch: 12 }, // Created At
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenses');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=expenses_${new Date().toISOString().split('T')[0]}.xlsx`);

    return res.status(StatusCodes.OK).send(buffer);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  exportExpenses,
};
