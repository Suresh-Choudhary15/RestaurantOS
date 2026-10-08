const { StatusCodes } = require('http-status-codes');

/**
 * Zod validation middleware factory.
 * Accepts a Zod schema object with optional `body`, `query`, and `params` schemas.
 * Example usage:
 * validate({
 *   body: schema,
 *   query: schema,
 *   params: schema
 * })
 */
const validate = (schemas) => async (req, res, next) => {
  try {
    if (schemas.body) {
      req.body = await schemas.body.parseAsync(req.body);
    }
    if (schemas.query) {
      req.query = await schemas.query.parseAsync(req.query);
    }
    if (schemas.params) {
      req.params = await schemas.params.parseAsync(req.params);
    }
    return next();
  } catch (err) {
    if (err.name === 'ZodError') {
      const formattedErrors = err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: 'fail',
        message: 'Validation failed',
        errors: formattedErrors,
      });
    }
    return next(err);
  }
};

module.exports = { validate };
