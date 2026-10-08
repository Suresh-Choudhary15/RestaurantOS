const prisma = require("../lib/prisma");

/**
 * Analytics Service - Rule-based analytics using existing data
 */

/**
 * Ingredient shortage prediction
 * Returns ingredients below reorder level
 */
async function getIngredientShortagePrediction() {
  // Prisma cannot directly compare two columns in a normal
  // findMany where clause, so fetch the ingredients and filter in JS.
  const allIngredients = await prisma.ingredient.findMany({
    include: {
      supplier: true,
      menuItems: {
        include: { menuItem: true },
      },
    },
  });

  const shortages = allIngredients
    .filter((ing) => Number(ing.currentStock) <= Number(ing.reorderLevel))
    .map((ing) => ({
      id: ing.id,
      name: ing.name,
      currentStock: Number(ing.currentStock),
      reorderLevel: Number(ing.reorderLevel),
      unit: ing.unit,
      supplier: ing.supplier?.name || "Unknown",
      status: "LOW_STOCK",
      severity: Number(ing.currentStock) === 0 ? "CRITICAL" : "WARNING",
      usedInMenuItems: ing.menuItems?.length || 0,
    }));

  return {
    totalShortages: shortages.length,
    critical: shortages.filter((s) => s.severity === "CRITICAL").length,
    warning: shortages.filter((s) => s.severity === "WARNING").length,
    items: shortages,
  };
}

/**
 * Optimal reorder quantity recommendation
 * Based on usage patterns and current stock
 */
async function getReorderRecommendations() {
  const ingredients = await prisma.ingredient.findMany({
    include: { supplier: true },
  });

  // Get order history for usage patterns (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentOrders = await prisma.order.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    include: {
      items: { include: { menuItem: { include: { ingredients: true } } } },
    },
  });

  const recommendations = ingredients
    .filter((ing) => Number(ing.currentStock) <= Number(ing.reorderLevel))
    .map((ing) => {
      // Simple calculation: assume 30-day average usage
      const daysSupply =
        Number(ing.currentStock) / (Number(ing.costPerUnit) || 1);
      const recommendedQty = Math.ceil(Number(ing.reorderLevel) * 3); // 3x reorder level

      return {
        ingredientId: ing.id,
        name: ing.name,
        currentStock: Number(ing.currentStock),
        recommendedQty,
        estimatedCost: recommendedQty * Number(ing.costPerUnit),
        supplier: ing.supplier?.name || "Unknown",
        leadTimeDays: 3, // Assumed standard lead time
        nextReorderDate: new Date(
          Date.now() + daysSupply * 24 * 60 * 60 * 1000,
        ),
      };
    });

  return {
    totalRecommendations: recommendations.length,
    estimatedTotalCost: recommendations.reduce(
      (sum, r) => sum + r.estimatedCost,
      0,
    ),
    recommendations,
  };
}

/**
 * Menu pricing suggestions
 * Based on ingredient costs and competition pricing
 */
async function getMenuPricingSuggestions() {
  const menuItems = await prisma.menuItem.findMany({
    include: { ingredients: { include: { ingredient: true } } },
  });

  const suggestions = await Promise.all(
    menuItems.map(async (item) => {
      // Calculate ingredient cost
      const ingredientCost = item.ingredients.reduce((sum, ing) => {
        const unitCost = Number(ing.ingredient.costPerUnit) || 0;
        const quantity = Number(ing.quantityNeeded) || 1;
        return sum + unitCost * quantity;
      }, 0);

      // Suggested markup: 3x ingredient cost (standard food service margin)
      const suggestedPrice = ingredientCost * 3;
      const currentPrice = Number(item.price);
      const margin =
        currentPrice > 0
          ? ((currentPrice - ingredientCost) / currentPrice) * 100
          : 0;

      return {
        itemId: item.id,
        name: item.name,
        currentPrice: currentPrice.toFixed(2),
        ingredientCost: ingredientCost.toFixed(2),
        suggestedPrice: suggestedPrice.toFixed(2),
        currentMargin: margin.toFixed(1),
        recommendedMargin: 70,
        priceOptimization:
          suggestedPrice > currentPrice ? "INCREASE" : "OPTIMAL",
      };
    }),
  );

  return {
    totalItems: suggestions.length,
    itemsNeedingAdjustment: suggestions.filter(
      (s) => s.priceOptimization === "INCREASE",
    ).length,
    suggestions,
  };
}

/**
 * Food preparation time estimation
 * Based on menu item prep times and current order queue
 */
async function getFoodPrepTimeEstimate() {
  const pendingOrders = await prisma.order.findMany({
    where: { status: { in: ["PENDING", "PREPARING"] } },
    include: {
      items: { include: { menuItem: true } },
    },
  });

  const avgPrepTime =
    pendingOrders.reduce((sum, order) => {
      const orderTime = order.items.reduce((itemSum, item) => {
        return itemSum + (item.menuItem.prepTime || 15);
      }, 0);
      return sum + (orderTime > 0 ? orderTime : 15);
    }, 0) / (pendingOrders.length || 1);

  const estimates = pendingOrders.map((order) => {
    const totalTime = order.items.reduce((sum, item) => {
      return sum + (item.menuItem.prepTime || 15);
    }, 0);

    return {
      orderId: order.id,
      tableNumber: order.table?.number,
      itemCount: order.items.length,
      estimatedMinutes: totalTime,
      status: order.status,
    };
  });

  return {
    activeOrders: pendingOrders.length,
    averagePrepTime: Math.ceil(avgPrepTime),
    totalQueueTime: Math.ceil(pendingOrders.length * avgPrepTime),
    estimates,
  };
}

/**
 * Waste analysis
 * Based on cancelled orders and ingredient usage patterns
 */
async function getWasteAnalysis() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const cancelledOrders = await prisma.order.findMany({
    where: {
      status: "CANCELLED",
      createdAt: { gte: thirtyDaysAgo },
    },
    include: {
      items: { include: { menuItem: true } },
    },
  });

  const totalCancelledValue = cancelledOrders.reduce((sum, order) => {
    return (
      sum +
      order.items.reduce((itemSum, item) => {
        return itemSum + Number(item.unitPrice) * item.quantity;
      }, 0)
    );
  }, 0);

  const allOrders = await prisma.order.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    include: { items: true },
  });

  const totalOrderValue = allOrders.reduce((sum, order) => {
    return (
      sum +
      order.items.reduce((itemSum, item) => {
        return itemSum + Number(item.unitPrice) * item.quantity;
      }, 0)
    );
  }, 0);

  const wastePercentage =
    totalOrderValue > 0
      ? ((totalCancelledValue / totalOrderValue) * 100).toFixed(1)
      : 0;

  // Top cancelled items
  const cancelledByItem = {};
  cancelledOrders.forEach((order) => {
    order.items.forEach((item) => {
      cancelledByItem[item.menuItemId] =
        (cancelledByItem[item.menuItemId] || 0) + item.quantity;
    });
  });

  const topCancelledItems = Object.entries(cancelledByItem)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([itemId, count]) => ({
      itemId,
      cancelledCount: count,
    }));

  return {
    period: "30_DAYS",
    totalCancelledOrders: cancelledOrders.length,
    totalCancelledValue: totalCancelledValue.toFixed(2),
    totalOrderValue: totalOrderValue.toFixed(2),
    wastePercentage,
    topCancelledItems,
    recommendation:
      wastePercentage > 10 ? "HIGH_WASTE_DETECTED" : "WASTE_ACCEPTABLE",
  };
}

module.exports = {
  getIngredientShortagePrediction,
  getReorderRecommendations,
  getMenuPricingSuggestions,
  getFoodPrepTimeEstimate,
  getWasteAnalysis,
};
