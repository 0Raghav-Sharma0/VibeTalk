import { AppError } from "../errors/AppError.js";

/** Validates required body fields exist and are non-empty strings */
export const requireBody = (...fields) => (req, _res, next) => {
  for (const field of fields) {
    const value = req.body[field];
    if (value === undefined || value === null || String(value).trim() === "") {
      return next(AppError.badRequest(`${field} is required`));
    }
  }
  next();
};

/** Validates required query params */
export const requireQuery = (...fields) => (req, _res, next) => {
  for (const field of fields) {
    const value = req.query[field];
    if (!value || String(value).trim() === "") {
      return next(AppError.badRequest(`Query param '${field}' is required`));
    }
  }
  next();
};
