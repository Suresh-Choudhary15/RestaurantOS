const { StatusCodes } = require('http-status-codes');
const prisma = require('../lib/prisma');
const { AppError } = require('../middleware/errorHandler');

/**
 * GET /api/tables
 */
async function getAllTables(req, res, next) {
  try {
    const { status } = req.query;
    const where = {};
    if (status) {
      where.status = status;
    }

    const tables = await prisma.table.findMany({
      where,
      orderBy: { number: 'asc' },
      include: {
        orders: {
          where: {
            status: { notIn: ['COMPLETED', 'CANCELLED'] },
          },
          select: {
            id: true,
            status: true,
            totalAmount: true,
            createdAt: true,
          },
        },
      },
    });

    return res.status(StatusCodes.OK).json({
      status: 'success',
      data: { tables },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/tables/:id
 */
async function getTableById(req, res, next) {
  try {
    const { id } = req.params;
    const table = await prisma.table.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!table) {
      throw new AppError('Table not found', StatusCodes.NOT_FOUND);
    }

    return res.status(StatusCodes.OK).json({
      status: 'success',
      data: { table },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/tables
 */
async function createTable(req, res, next) {
  try {
    const { number, capacity, status } = req.body;

    const existingTable = await prisma.table.findUnique({
      where: { number },
    });

    if (existingTable) {
      throw new AppError(`Table number ${number} already exists`, StatusCodes.CONFLICT);
    }

    const table = await prisma.table.create({
      data: {
        number,
        capacity,
        status: status || 'AVAILABLE',
      },
    });

    return res.status(StatusCodes.CREATED).json({
      status: 'success',
      data: { table },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/tables/:id
 */
async function updateTable(req, res, next) {
  try {
    const { id } = req.params;
    const { number, capacity, status, currentOrderId } = req.body;

    const existingTable = await prisma.table.findUnique({ where: { id } });
    if (!existingTable) {
      throw new AppError('Table not found', StatusCodes.NOT_FOUND);
    }

    if (number && number !== existingTable.number) {
      const duplicate = await prisma.table.findUnique({ where: { number } });
      if (duplicate) {
        throw new AppError(`Table number ${number} already exists`, StatusCodes.CONFLICT);
      }
    }

    const table = await prisma.table.update({
      where: { id },
      data: {
        ...(number !== undefined && { number }),
        ...(capacity !== undefined && { capacity }),
        ...(status !== undefined && { status }),
        ...(currentOrderId !== undefined && { currentOrderId }),
      },
    });

    return res.status(StatusCodes.OK).json({
      status: 'success',
      data: { table },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/tables/:id
 */
async function deleteTable(req, res, next) {
  try {
    const { id } = req.params;

    const table = await prisma.table.findUnique({
      where: { id },
      include: {
        orders: {
          where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
        },
      },
    });

    if (!table) {
      throw new AppError('Table not found', StatusCodes.NOT_FOUND);
    }

    if (table.orders.length > 0) {
      throw new AppError('Cannot delete a table with active orders', StatusCodes.BAD_REQUEST);
    }

    await prisma.table.delete({ where: { id } });

    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Table deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllTables,
  getTableById,
  createTable,
  updateTable,
  deleteTable,
};
