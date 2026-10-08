const { StatusCodes } = require('http-status-codes');
const prisma = require('../lib/prisma');
const { AppError } = require('../middleware/errorHandler');

async function getSuppliers(req, res, next) {
  try {
    const suppliers = await prisma.supplier.findMany();
    return res.status(StatusCodes.OK).json({ status: 'success', data: { suppliers } });
  } catch (err) { next(err); }
}

async function createSupplier(req, res, next) {
  try {
    const supplier = await prisma.supplier.create({ data: req.body });
    return res.status(StatusCodes.CREATED).json({ status: 'success', data: { supplier } });
  } catch (err) { next(err); }
}

async function updateSupplier(req, res, next) {
  try {
    const supplier = await prisma.supplier.update({
      where: { id: req.params.id },
      data: req.body,
    });
    return res.status(StatusCodes.OK).json({ status: 'success', data: { supplier } });
  } catch (err) { next(err); }
}

async function deleteSupplier(req, res, next) {
  try {
    await prisma.supplier.delete({ where: { id: req.params.id } });
    return res.status(StatusCodes.OK).json({ status: 'success', message: 'Supplier deleted' });
  } catch (err) { next(err); }
}

module.exports = {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};
