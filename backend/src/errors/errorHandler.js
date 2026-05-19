import { AppError } from "./AppError.js";

export function notFoundHandler(req, res) {
  res.status(404).json({
    message: `Route ${req.method} ${req.path} not found`,
    code: "ROUTE_NOT_FOUND",
  });
}

export function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
      ...(err.code && { code: err.code }),
    });
  }

  if (err.message?.includes("CORS blocked")) {
    return res.status(403).json({ message: err.message, code: "CORS_BLOCKED" });
  }

  console.error("Unhandled error:", err);
  res.status(500).json({
    message: "Internal Server Error",
    code: "INTERNAL_ERROR",
  });
}
