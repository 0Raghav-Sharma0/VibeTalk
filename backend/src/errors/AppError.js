export class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }

  static badRequest(message, code = "BAD_REQUEST") {
    return new AppError(message, 400, code);
  }

  static unauthorized(message = "Unauthorized") {
    return new AppError(message, 401, "UNAUTHORIZED");
  }

  static notFound(message = "Not found", code = "NOT_FOUND") {
    return new AppError(message, 404, code);
  }

  static forbidden(message = "Forbidden", code = "FORBIDDEN") {
    return new AppError(message, 403, code);
  }

  static serviceUnavailable(message, code = "SERVICE_UNAVAILABLE") {
    return new AppError(message, 503, code);
  }
}
