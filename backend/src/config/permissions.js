// RBAC permission matrix
// Roles: OWNER, MANAGER, CHEF, WAITER, CASHIER
// Resources use kebab-case; actions are verbs. '*' matches everything.

const RESOURCES = Object.freeze({
  MENU: 'menu',
  ORDERS: 'orders',
  TABLES: 'tables',
  INVENTORY: 'inventory',
  SUPPLIERS: 'suppliers',
  EXPENSES: 'expenses',
  REPORTS: 'reports',
  USERS: 'users',
  AUDIT_LOGS: 'audit-logs',
  PAYMENTS: 'payments',
});

const ACTIONS = Object.freeze({
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  VOID: 'void',
  APPROVE: 'approve',
});

/**
 * ROLE_PERMISSIONS[role] = { resource: [actions...] }
 * Use '*' as resource or action value for unrestricted access.
 */
const ROLE_PERMISSIONS = Object.freeze({
  OWNER: {
    '*': ['*'], // unrestricted
  },
  MANAGER: {
    [RESOURCES.MENU]: Object.values(ACTIONS).filter((a) => a !== ACTIONS.APPROVE),
    [RESOURCES.ORDERS]: Object.values(ACTIONS),
    [RESOURCES.TABLES]: Object.values(ACTIONS),
    [RESOURCES.INVENTORY]: Object.values(ACTIONS),
    [RESOURCES.SUPPLIERS]: Object.values(ACTIONS),
    [RESOURCES.EXPENSES]: Object.values(ACTIONS),
    [RESOURCES.REPORTS]: [ACTIONS.READ],
    [RESOURCES.USERS]: [ACTIONS.READ, ACTIONS.UPDATE],
    [RESOURCES.AUDIT_LOGS]: [ACTIONS.READ],
    [RESOURCES.PAYMENTS]: [ACTIONS.READ, ACTIONS.VOID],
  },
  CHEF: {
    [RESOURCES.MENU]: [ACTIONS.READ, ACTIONS.UPDATE], // mark items unavailable
    [RESOURCES.ORDERS]: [ACTIONS.READ, ACTIONS.UPDATE], // advance item status
    [RESOURCES.INVENTORY]: [ACTIONS.READ, ACTIONS.UPDATE], // decrement stock
    [RESOURCES.TABLES]: [ACTIONS.READ],
  },
  WAITER: {
    [RESOURCES.MENU]: [ACTIONS.READ],
    [RESOURCES.ORDERS]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE],
    [RESOURCES.TABLES]: [ACTIONS.READ, ACTIONS.UPDATE],
  },
  CASHIER: {
    [RESOURCES.ORDERS]: [ACTIONS.READ, ACTIONS.UPDATE],
    [RESOURCES.PAYMENTS]: [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.VOID],
    [RESOURCES.REPORTS]: [ACTIONS.READ],
  },
});

/**
 * Check whether a role may perform `action` on `resource`.
 */
function can(role, action, resource) {
  const grants = ROLE_PERMISSIONS[role];
  if (!grants) return false;

  if (grants['*'] && grants['*'].includes('*')) return true;

  const allowed = grants[resource];
  if (!allowed) return false;
  return allowed.includes(action) || allowed.includes('*');
}

/**
 * List of resources a role can perform `action` on.
 */
function allowedResources(role, action) {
  const grants = ROLE_PERMISSIONS[role];
  if (!grants) return [];
  if (grants['*'] && grants['*'].includes('*')) return Object.values(RESOURCES);
  return Object.keys(grants).filter(
    (resource) => grants[resource].includes(action) || grants[resource].includes('*'),
  );
}

module.exports = {
  RESOURCES,
  ACTIONS,
  ROLE_PERMISSIONS,
  can,
  allowedResources,
};
