const { StatusCodes } = require('http-status-codes');
const analyticsService = require('../services/analyticsService');
const prisma = require('../lib/prisma');

/**
 * GET /api/analytics/ingredient-shortage
 */
async function getIngredientShortage(req, res, next) {
  try {
    const data = await analyticsService.getIngredientShortagePrediction();
    return res.status(StatusCodes.OK).json({ status: 'success', data });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/analytics/reorder-recommendations
 */
async function getReorderRecommendations(req, res, next) {
  try {
    const data = await analyticsService.getReorderRecommendations();
    return res.status(StatusCodes.OK).json({ status: 'success', data });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/analytics/menu-pricing
 */
async function getMenuPricingSuggestions(req, res, next) {
  try {
    const data = await analyticsService.getMenuPricingSuggestions();
    return res.status(StatusCodes.OK).json({ status: 'success', data });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/analytics/prep-time
 */
async function getFoodPrepTimeEstimate(req, res, next) {
  try {
    const data = await analyticsService.getFoodPrepTimeEstimate();
    return res.status(StatusCodes.OK).json({ status: 'success', data });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/analytics/waste-analysis
 */
async function getWasteAnalysis(req, res, next) {
  try {
    const data = await analyticsService.getWasteAnalysis();
    return res.status(StatusCodes.OK).json({ status: 'success', data });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/analytics/dashboard-summary
 * Returns aggregated dashboard data
 */
async function getDashboardSummary(req, res, next) {
  try {
    const [
      shortage,
      reorder,
      pricing,
      prepTime,
      waste,
      orders,
      tables,
      expenses,
    ] = await Promise.all([
      analyticsService.getIngredientShortagePrediction(),
      analyticsService.getReorderRecommendations(),
      analyticsService.getMenuPricingSuggestions(),
      analyticsService.getFoodPrepTimeEstimate(),
      analyticsService.getWasteAnalysis(),
      prisma.order.findMany({
        where: { status: { in: ['PENDING', 'PREPARING', 'READY'] } },
        select: { status: true },
      }),
      prisma.table.findMany({
        select: { status: true },
      }),
      prisma.expense.findMany({
        where: {
          date: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        select: { amount: true, category: true },
      }),
    ]);

    // Aggregate orders by status
    const ordersByStatus = {
      pending: orders.filter(o => o.status === 'PENDING').length,
      preparing: orders.filter(o => o.status === 'PREPARING').length,
      ready: orders.filter(o => o.status === 'READY').length,
    };

    // Aggregate table occupancy
    const tableOccupancy = {
      available: tables.filter(t => t.status === 'AVAILABLE').length,
      occupied: tables.filter(t => t.status === 'OCCUPIED').length,
      reserved: tables.filter(t => t.status === 'RESERVED').length,
      maintenance: tables.filter(t => t.status === 'MAINTENANCE').length,
      total: tables.length,
    };

    // Aggregate expenses
    const expensesByCategory = {};
    let totalExpenses = 0;
    expenses.forEach(exp => {
      totalExpenses += Number(exp.amount);
      expensesByCategory[exp.category] = (expensesByCategory[exp.category] || 0) + Number(exp.amount);
    });

    // Sales overview (orders x average item price)
    const todayOrders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
      include: { items: true },
    });

    const todaySales = todayOrders.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => itemSum + Number(item.unitPrice) * item.quantity, 0);
    }, 0);

    return res.status(StatusCodes.OK).json({
      status: 'success',
      data: {
        salesOverview: {
          todaySales: todaySales.toFixed(2),
          completedOrders: todayOrders.length,
        },
        activeOrders: ordersByStatus,
        tableOccupancy,
        lowStockWarnings: shortage.totalShortages,
        expenseSummary: {
          total: totalExpenses.toFixed(2),
          byCategory: expensesByCategory,
        },
        shortage,
        prepTime,
        waste,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getIngredientShortage,
  getReorderRecommendations,
  getMenuPricingSuggestions,
  getFoodPrepTimeEstimate,
  getWasteAnalysis,
  getDashboardSummary,
};
