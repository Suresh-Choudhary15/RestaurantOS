// Express JWT Authentication & Role-Based Access Control (RBAC) Middlewares
const { StatusCodes } = require('http-status-codes');
const { verifyToken } = require('../utils/jwt');
const { AppError } = require('./errorHandler');
const { can } = require('../config/permissions');
const prisma = require('../lib/prisma');

/**
 * Authenticate JWT token from Authorization header (Bearer <token>).
 * Attaches decoded user payload and database User record to req.user.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access token required', StatusCodes.UNAUTHORIZED);
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError('Token has expired', StatusCodes.UNAUTHORIZED);
      }
      throw new AppError('Invalid authentication token', StatusCodes.UNAUTHORIZED);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new AppError('User account no longer exists', StatusCodes.UNAUTHORIZED);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated', StatusCodes.FORBIDDEN);
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Require specific role(s). Usage: authorize('OWNER', 'MANAGER') or authorize(['OWNER'])
 */
function authorize(...allowedRoles) {
  const roles = allowedRoles.flat();
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', StatusCodes.UNAUTHORIZED));
    }

    if (req.user.role === 'OWNER' || roles.includes(req.user.role)) {
      return next();
    }

    return next(
      new AppError(
        `Forbidden: Role '${req.user.role}' is not authorized to access this resource`,
        StatusCodes.FORBIDDEN,
      ),
    );
  };
}

/**
 * Require permission on resource and action based on RBAC matrix.
 * Usage: requirePermission('orders', 'create') or requirePermission('create', 'orders')
 */
function requirePermission(param1, param2) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', StatusCodes.UNAUTHORIZED));
    }

    // Support both requirePermission(resource, action) and requirePermission(action, resource)
    const isParam1Action = ['create', 'read', 'update', 'delete', 'void', 'approve'].includes(param1);
    const action = isParam1Action ? param1 : param2;
    const resource = isParam1Action ? param2 : param1;

    if (can(req.user.role, action, resource)) {
      return next();
    }

    return next(
      new AppError(
        `Forbidden: Role '${req.user.role}' cannot perform '${action}' on '${resource}'`,
        StatusCodes.FORBIDDEN,
      ),
    );
  };
}

module.exports = {
  authenticate,
  requireAuth: authenticate,
  authorize,
  requireRole: authorize,
  requirePermission,
};
