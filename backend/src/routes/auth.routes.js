// /api/auth routes
const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { StatusCodes } = require('http-status-codes');

const prisma = require('../lib/prisma');
const { AppError } = require('../middleware/errorHandler');
const { requireAuth } = require('../middleware/auth');
const authService = require('../services/authService');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many login attempts, try again later' },
  skip: () => process.env.NODE_ENV === 'test',
});

const loginValidators = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
];

/**
 * POST /api/auth/login
 */
router.post('/login', loginLimiter, loginValidators, async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new AppError('Validation failed', StatusCodes.UNPROCESSABLE_ENTITY, errors.array()),
    );
  }

  const { email, password } = req.body;

  try {
    const result = await authService.login(email, password);

    req.user = result.user; // so audit/logger knows user if chained
    await prisma.auditLog
      .create({
        data: {
          userId: result.user.id,
          action: 'LOGIN',
          entity: 'session',
          entityId: result.user.id,
          changes: { email: result.user.email },
          ipAddress: req.ip,
        },
      })
      .catch((err) => console.warn('[AUDIT] login log failed:', err.message));

    res.json({ status: 'success', data: result });
  } catch (err) {
    if (err.code === 'INVALID_CREDENTIALS') {
      return next(new AppError(err.message, StatusCodes.UNAUTHORIZED));
    }
    if (err.code === 'ACCOUNT_DISABLED') {
      return next(new AppError(err.message, StatusCodes.FORBIDDEN));
    }
    next(err);
  }
});

/**
 * GET /api/auth/me
 */
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await authService.me(req.user.id);
    if (!user) {
      return next(new AppError('User not found', StatusCodes.NOT_FOUND));
    }
    res.json({ status: 'success', data: { user } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
