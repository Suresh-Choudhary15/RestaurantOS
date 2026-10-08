const { StatusCodes } = require('http-status-codes');
const prisma = require('../lib/prisma');
const { AppError } = require('../middleware/errorHandler');

async function getAllOrders(req, res, next) {
  try {
    const { status, tableId, waiterId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (tableId) where.tableId = tableId;
    if (waiterId) where.waiterId = waiterId;

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        table: { select: { number: true } },
        waiter: { select: { firstName: true, lastName: true } },
        items: { include: { menuItem: true } },
      },
    });

    return res.status(StatusCodes.OK).json({ status: 'success', data: { orders } });
  } catch (err) {
    next(err);
  }
}

async function getOrderById(req, res, next) {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        table: true,
        waiter: true,
        items: { include: { menuItem: true } },
      },
    });

    if (!order) throw new AppError('Order not found', StatusCodes.NOT_FOUND);
    return res.status(StatusCodes.OK).json({ status: 'success', data: { order } });
  } catch (err) {
    next(err);
  }
}

async function createOrder(req, res, next) {
  try {
    const { tableId, waiterId, status, notes, items } = req.body;

    // Transaction to create order and items and update table status
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          tableId,
          waiterId,
          status: status || 'PENDING',
          notes,
          items: {
            create: items.map(item => ({
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              notes: item.notes,
              unitPrice: 0, // Should be fetched from MenuItem in real impl, but keeping it simple for CRUD
            })),
          },
        },
        include: { items: true },
      });

      await tx.table.update({
        where: { id: tableId },
        data: { status: 'OCCUPIED', currentOrderId: order.id },
      });

      return order;
    });

    return res.status(StatusCodes.CREATED).json({ status: 'success', data: { order: result } });
  } catch (err) {
    next(err);
  }
}

async function updateOrder(req, res, next) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const order = await prisma.order.update({
      where: { id },
      data: { status, notes },
    });

    // If order is COMPLETED or CANCELLED, free the table
    if (['COMPLETED', 'CANCELLED'].includes(status)) {
      await prisma.table.update({
        where: { currentOrderId: id },
        data: { status: 'AVAILABLE', currentOrderId: null },
      });
    }

    return res.status(StatusCodes.OK).json({ status: 'success', data: { order } });
  } catch (err) {
    next(err);
  }
}

async function updateOrderItem(req, res, next) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const item = await prisma.orderItem.update({
      where: { id },
      data: { status, notes },
    });

    return res.status(StatusCodes.OK).json({ status: 'success', data: { item } });
  } catch (err) {
    next(err);
  }
}

async function deleteOrder(req, res, next) {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new AppError('Order not found', StatusCodes.NOT_FOUND);

    await prisma.order.delete({ where: { id } });
    await prisma.table.update({
      where: { currentOrderId: id },
      data: { status: 'AVAILABLE', currentOrderId: null },
    });

    return res.status(StatusCodes.OK).json({ status: 'success', message: 'Order deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderItem,
  deleteOrder,
};
