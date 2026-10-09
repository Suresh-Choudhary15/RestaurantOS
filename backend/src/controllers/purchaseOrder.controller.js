const { StatusCodes } = require('http-status-codes');
const prisma = require('../lib/prisma');
const { AppError } = require('../middleware/errorHandler');

/**
 * GET /api/purchase-orders
 */
async function getPurchaseOrders(req, res, next) {
  try {
    const { supplierId, status } = req.query;
    const where = {};
    if (supplierId) where.supplierId = supplierId;
    if (status) where.status = status;

    const orders = await prisma.purchaseOrder.findMany({
      where,
      orderBy: { orderDate: 'desc' },
      include: {
        supplier: { select: { id: true, name: true } },
        createdBy: { select: { firstName: true, lastName: true } },
        items: {
          include: { ingredient: { select: { id: true, name: true, unit: true } } },
        },
      },
    });

    return res.status(StatusCodes.OK).json({ status: 'success', data: { orders } });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/purchase-orders/:id
 */
async function getPurchaseOrderById(req, res, next) {
  try {
    const { id } = req.params;

    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        createdBy: { select: { firstName: true, lastName: true, email: true } },
        items: {
          include: {
            ingredient: { select: { id: true, name: true, unit: true, currentStock: true } },
          },
        },
      },
    });

    if (!order) {
      throw new AppError('Purchase order not found', StatusCodes.NOT_FOUND);
    }

    return res.status(StatusCodes.OK).json({ status: 'success', data: { order } });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/purchase-orders
 */
async function createPurchaseOrder(req, res, next) {
  try {
    const { supplierId, items, expectedDate, notes } = req.body;

    // Validate supplier
    if (!supplierId) {
      throw new AppError('supplierId is required', StatusCodes.BAD_REQUEST);
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplier) {
      throw new AppError('Supplier not found', StatusCodes.NOT_FOUND);
    }

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new AppError('At least one item is required', StatusCodes.BAD_REQUEST);
    }

    // Validate each item and get ingredients
    const ingredientIds = items.map(item => item.ingredientId);
    const ingredients = await prisma.ingredient.findMany({
      where: { id: { in: ingredientIds } },
    });

    if (ingredients.length !== items.length) {
      throw new AppError('One or more ingredients not found', StatusCodes.NOT_FOUND);
    }

    // Calculate totals and validate
    let totalAmount = 0;
    const validatedItems = items.map(item => {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);

      if (quantity <= 0) {
        throw new AppError('Item quantity must be greater than 0', StatusCodes.BAD_REQUEST);
      }

      if (unitPrice < 0) {
        throw new AppError('Item unit price cannot be negative', StatusCodes.BAD_REQUEST);
      }

      const itemTotal = quantity * unitPrice;
      totalAmount += itemTotal;

      return {
        ingredientId: item.ingredientId,
        quantity,
        unitPrice,
        total: itemTotal,
      };
    });

    // Create purchase order with items in transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.purchaseOrder.create({
        data: {
          supplierId,
          status: 'DRAFT',
          totalAmount,
          expectedDate: expectedDate ? new Date(expectedDate) : null,
          notes: notes || null,
          createdById: req.user.id,
          items: {
            create: validatedItems,
          },
        },
        include: {
          supplier: { select: { id: true, name: true } },
          createdBy: { select: { firstName: true, lastName: true } },
          items: {
            include: { ingredient: { select: { id: true, name: true, unit: true } } },
          },
        },
      });

      return newOrder;
    });

    return res.status(StatusCodes.CREATED).json({
      status: 'success',
      data: { order },
      message: 'Purchase order created successfully',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/purchase-orders/:id
 */
async function updatePurchaseOrder(req, res, next) {
  try {
    const { id } = req.params;
    const { supplierId, items, expectedDate, notes } = req.body;

    // Get existing order
    const existingOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      throw new AppError('Purchase order not found', StatusCodes.NOT_FOUND);
    }

    // Only allow updates on DRAFT orders
    if (existingOrder.status !== 'DRAFT') {
      throw new AppError(
        `Cannot update purchase order with status ${existingOrder.status}`,
        StatusCodes.BAD_REQUEST
      );
    }

    // Validate supplier if provided
    if (supplierId) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId },
      });

      if (!supplier) {
        throw new AppError('Supplier not found', StatusCodes.NOT_FOUND);
      }
    }

    // Validate items if provided
    let validatedItems = null;
    let totalAmount = existingOrder.totalAmount;

    if (items && Array.isArray(items)) {
      if (items.length === 0) {
        throw new AppError('At least one item is required', StatusCodes.BAD_REQUEST);
      }

      const ingredientIds = items.map(item => item.ingredientId);
      const ingredients = await prisma.ingredient.findMany({
        where: { id: { in: ingredientIds } },
      });

      if (ingredients.length !== items.length) {
        throw new AppError('One or more ingredients not found', StatusCodes.NOT_FOUND);
      }

      totalAmount = 0;
      validatedItems = items.map(item => {
        const quantity = Number(item.quantity);
        const unitPrice = Number(item.unitPrice);

        if (quantity <= 0) {
          throw new AppError('Item quantity must be greater than 0', StatusCodes.BAD_REQUEST);
        }

        if (unitPrice < 0) {
          throw new AppError('Item unit price cannot be negative', StatusCodes.BAD_REQUEST);
        }

        const itemTotal = quantity * unitPrice;
        totalAmount += itemTotal;

        return {
          ingredientId: item.ingredientId,
          quantity,
          unitPrice,
          total: itemTotal,
        };
      });
    }

    // Update in transaction
    const order = await prisma.$transaction(async (tx) => {
      // Delete old items if new items provided
      if (validatedItems) {
        await tx.purchaseOrderItem.deleteMany({
          where: { purchaseOrderId: id },
        });
      }

      const updatedOrder = await tx.purchaseOrder.update({
        where: { id },
        data: {
          ...(supplierId && { supplierId }),
          ...(expectedDate && { expectedDate: new Date(expectedDate) }),
          ...(notes !== undefined && { notes }),
          ...(validatedItems && { totalAmount }),
          ...(validatedItems && {
            items: {
              create: validatedItems,
            },
          }),
        },
        include: {
          supplier: { select: { id: true, name: true } },
          createdBy: { select: { firstName: true, lastName: true } },
          items: {
            include: { ingredient: { select: { id: true, name: true, unit: true } } },
          },
        },
      });

      return updatedOrder;
    });

    return res.status(StatusCodes.OK).json({
      status: 'success',
      data: { order },
      message: 'Purchase order updated successfully',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/purchase-orders/:id/status
 */
async function updatePurchaseOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      throw new AppError('status is required', StatusCodes.BAD_REQUEST);
    }

    const validStatuses = ['DRAFT', 'ORDERED', 'RECEIVED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, StatusCodes.BAD_REQUEST);
    }

    // Get existing order
    const existingOrder = await prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingOrder) {
      throw new AppError('Purchase order not found', StatusCodes.NOT_FOUND);
    }

    // Enforce allowed purchase-order status transitions.
    const allowedTransitions = {
      DRAFT: ['ORDERED', 'CANCELLED'],
      ORDERED: ['RECEIVED', 'CANCELLED'],
      RECEIVED: [],
      CANCELLED: [],
    };

    if (!allowedTransitions[existingOrder.status]?.includes(status)) {
      throw new AppError(
        `Cannot change purchase order status from ${existingOrder.status} to ${status}`,
        StatusCodes.BAD_REQUEST
      );
    }

    // Update in transaction
    const order = await prisma.$transaction(async (tx) => {
      // If transitioning to RECEIVED, update ingredient stock
      if (status === 'RECEIVED' && existingOrder.status !== 'RECEIVED') {
        const orderItems = await tx.purchaseOrderItem.findMany({
          where: { purchaseOrderId: id },
          include: { ingredient: true },
        });

        // Update stock and create movements
        for (const item of orderItems) {
          // Update ingredient stock
          await tx.ingredient.update({
            where: { id: item.ingredientId },
            data: {
              currentStock: {
                increment: Number(item.quantity),
              },
            },
          });

          // Create stock movement
          await tx.stockMovement.create({
            data: {
              ingredientId: item.ingredientId,
              type: 'IN',
              quantity: item.quantity,
              reason: 'Purchase Order Received',
              reference: `PO-${id.substring(0, 8)}`,
              createdById: req.user.id,
            },
          });
        }
      }

      const updatedOrder = await tx.purchaseOrder.update({
        where: { id },
        data: { status },
        include: {
          supplier: { select: { id: true, name: true } },
          createdBy: { select: { firstName: true, lastName: true } },
          items: {
            include: { ingredient: { select: { id: true, name: true, unit: true } } },
          },
        },
      });

      return updatedOrder;
    });

    return res.status(StatusCodes.OK).json({
      status: 'success',
      data: { order },
      message: `Purchase order status updated to ${status}`,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/purchase-orders/:id
 */
async function deletePurchaseOrder(req, res, next) {
  try {
    const { id } = req.params;

    const order = await prisma.purchaseOrder.findUnique({
      where: { id },
    });

    if (!order) {
      throw new AppError('Purchase order not found', StatusCodes.NOT_FOUND);
    }

    // Only allow deletion of DRAFT orders
    if (order.status !== 'DRAFT') {
      throw new AppError(
        `Cannot delete purchase order with status ${order.status}`,
        StatusCodes.BAD_REQUEST
      );
    }

    // Delete in transaction (cascade will handle items)
    await prisma.$transaction(async (tx) => {
      await tx.purchaseOrderItem.deleteMany({
        where: { purchaseOrderId: id },
      });

      await tx.purchaseOrder.delete({
        where: { id },
      });
    });

    return res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Purchase order deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  updatePurchaseOrderStatus,
  deletePurchaseOrder,
};
