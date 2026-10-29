import { ApiError } from '../utils/ApiError.js';

export const validateRequest = (schema) => (req, res, next) => {
  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const errorMessages = parsed.error.issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return next(new ApiError(400, 'Validation failed', errorMessages));
    }
    req.body = parsed.data;
    next();
  } catch (error) {
    next(error);
  }
};
