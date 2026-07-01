import { ApiError } from './http.js';

// Require a non-empty string within [min, max] length. Returns the (optionally trimmed) value.
export function requireString(value, field, { min = 1, max = Infinity, trim = true } = {}) {
  if (typeof value !== 'string') throw new ApiError(400, `${field} is required`);
  const v = trim ? value.trim() : value;
  if (v.length < min) throw new ApiError(400, `${field} must be at least ${min} character(s)`);
  if (v.length > max) throw new ApiError(400, `${field} must be at most ${max} characters`);
  return v;
}

// Optional string: empty/undefined/null -> null. Otherwise validate max length.
export function optionalString(value, field, { max = Infinity } = {}) {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') throw new ApiError(400, `${field} must be a string`);
  const v = value.trim();
  if (v.length === 0) return null;
  if (v.length > max) throw new ApiError(400, `${field} must be at most ${max} characters`);
  return v;
}

const USERNAME_RE = /^[a-z0-9_]{3,30}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateUsername(value) {
  const v = requireString(value, 'username').toLowerCase();
  if (!USERNAME_RE.test(v)) {
    throw new ApiError(400, 'Username must be 3-30 characters: lowercase letters, numbers, or underscore');
  }
  return v;
}

export function validateEmail(value) {
  const v = requireString(value, 'email').toLowerCase();
  if (!EMAIL_RE.test(v)) throw new ApiError(400, 'A valid email address is required');
  return v;
}

// Parse a positive integer route param (e.g. /posts/:id).
export function parseId(value, field = 'id') {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new ApiError(400, `Invalid ${field}`);
  return id;
}
