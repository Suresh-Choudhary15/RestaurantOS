// Audit Trail middleware — records CRUD actions to the audit_logs table.
const prisma = require('../lib/prisma');

const METHOD_TO_ACTION = Object.freeze({
  POST: 'CREATE',
  PUT: 'UPDATE',
  PATCH: 'UPDATE',
  DELETE: 'DELETE',
  GET: 'READ',
});

function resolveEntityId(req) {
  let id = req.params?.id;
  if (id == null) return '';
  // Nested routes can shadow :id; stringify objects defensively
  return typeof id === 'object' ? JSON.stringify(id) : String(id);
}

/**
 * audit(entity) — attach to any route handling an entity type.
 * Logs a row after successful (2xx/3xx) responses; failures are skipped so the
 * trail reflects actual mutations only. Never blocks the request — logging
 * errors are swallowed with a console warning.
 *
 * Options:
 *   entity:    resource name, e.g. 'orders', 'menu' (required)
 *   action:    override the action verb (default: derived from HTTP method)
 *   changes:   fn(req, res) => JSON-serializable payload stored in `changes`
 */
function audit(entity, options = {}) {
  const { action, changes } = options;

  return (req, res, next) => {
    const send = res.json.bind(res);
    res.json = (body) => {
      const ok = res.statusCode >= 200 && res.statusCode < 400;
      if (ok && req.user) {
        const record = {
          userId: req.user.id,
          action: action || METHOD_TO_ACTION[req.method] || 'READ',
          entity,
          entityId: resolveEntityId(req),
          changes:
            typeof changes === 'function'
              ? safeJson(() => changes(req, res))
              : undefined,
          ipAddress: req.ip || req.socket?.remoteAddress || null,
        };

        prisma.auditLog
          .create({ data: record })
          .catch((err) =>
            console.warn(`[AUDIT] failed to log ${record.action} ${entity}:`, err.message),
          );
      }
      return send(body);
    };
    next();
  };
}

function safeJson(fn) {
  try {
    return JSON.parse(JSON.stringify(fn() ?? {}));
  } catch (_) {
    return null;
  }
}

module.exports = { audit, METHOD_TO_ACTION };
