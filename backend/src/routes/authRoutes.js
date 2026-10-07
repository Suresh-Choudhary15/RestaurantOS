// Express JWT Auth Routes (/api/auth/login, /api/auth/me)
const express = require('express');
const { body, validationResult } = require('express-validator');
const { StatusCodes } = require('http-status-codes');
const authService = require('../services/authService');
const { authenticate } = require('../middleware/auth');
const { audit } = require('../middleware/audit');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

const loginValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post('/login', loginValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'fail',
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    try {
      const result = await authService.login(email, password);
      return res.status(StatusCodes.OK).json({
        status: 'success',
        data: result,
      });
    } catch (err) {
      if (err.code === 'INVALID_CREDENTIALS') {
        throw new AppError('Invalid email or password', StatusCodes.UNAUTHORIZED);
      }
      if (err.code === 'ACCOUNT_DISABLED') {
        throw new AppError('Account is deactivated', StatusCodes.FORBIDDEN);
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 * Headers: Authorization: Bearer <token>
 */
router.get('/me', authenticate, audit('users', { action: 'READ' }), async (req, res, next) => {
  try {
    const user = await authService.me(req.user.id);
    if (!user) {
      throw new AppError('User not found', StatusCodes.NOT_FOUND);
    }
    return res.status(StatusCodes.OK).json({
      status: 'success',
      data: { user },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
