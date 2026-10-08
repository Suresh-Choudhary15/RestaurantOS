const express = require('express');
const { authenticate, requirePermission } = require('../middleware/auth');
const analyticsController = require('../controllers/analytics.controller');

const router = express.Router();

router.use(authenticate);

router.get(
  '/ingredient-shortage',
  requirePermission('read', 'inventory'),
  analyticsController.getIngredientShortage
);

router.get(
  '/reorder-recommendations',
  requirePermission('read', 'inventory'),
  analyticsController.getReorderRecommendations
);

router.get(
  '/menu-pricing',
  requirePermission('read', 'menu'),
  analyticsController.getMenuPricingSuggestions
);

router.get(
  '/prep-time',
  requirePermission('read', 'orders'),
  analyticsController.getFoodPrepTimeEstimate
);

router.get(
  '/waste-analysis',
  requirePermission('read', 'orders'),
  analyticsController.getWasteAnalysis
);

router.get(
  '/dashboard-summary',
  requirePermission('read', 'orders'),
  analyticsController.getDashboardSummary
);

module.exports = router;
