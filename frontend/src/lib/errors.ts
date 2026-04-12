export class ApplicationError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode = 500,
    details?: Record<string, unknown>,
    cause?: unknown,
  ) {
    super(message, { cause });
    this.name = new.target.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ConfigurationError extends ApplicationError {
  constructor(message: string, details?: Record<string, unknown>, cause?: unknown) {
    super(message, "CONFIGURATION_ERROR", 500, details, cause);
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string, details?: Record<string, unknown>, cause?: unknown) {
    super(message, "VALIDATION_ERROR", 400, details, cause);
  }
}

export class AuthenticationError extends ApplicationError {
  constructor(message: string, details?: Record<string, unknown>, cause?: unknown) {
    super(message, "AUTHENTICATION_ERROR", 401, details, cause);
  }
}

export class NotFoundError extends ApplicationError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} not found.` : resource,
      "NOT_FOUND",
      404,
      id ? { resource, id } : undefined,
    );
  }
}
