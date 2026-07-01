// Small HTTP utilities shared across routes.

// Throw this from any handler to produce a clean JSON error with a status code.
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Wrap an async route handler so rejected promises flow to the error middleware
// instead of crashing the process with an unhandled rejection.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
