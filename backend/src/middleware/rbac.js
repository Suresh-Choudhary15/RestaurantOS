// RBAC middleware — builds on requireAuth; enforces role permissions.
const { StatusCodes } = require('http-status-codes');
const { AppError } = require('./errorHandler');
const { can } = require('../config/permissions');

/**
 * Allow only the listed roles through. OWNER always passes.
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', StatusCodes.UNAUTHORIZED));
    }
    if (req.user.role === 'OWNER' || roles.includes(req.user.role)) {
      return next();
    }
    return next(
      new AppError('Insufficient role', StatusCodes.FORBIDDEN, [
        `Requires role: ${roles.join(' or ')}`,
      ]),
    );
  };
}

/**
 * Allow only roles that hold (action, resource) per the matrix in config/permissions.
 */
function requirePermission(action, resource) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', StatusCodes.UNAUTHORIZED));
    }
    if (can(req.user.role, action, resource)) {
      return next();
    }
    return next(
      new AppError('Permission denied', StatusCodes.FORBIDDEN, [
        `${req.user.role} cannot ${action} ${resource}`,
      ]),
    );
  };
}

module.exports = { requireRole, requirePermission };
