import { StatusCodes } from "http-status-codes";

export class HttpException extends Error {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;
  public errors: any;

  constructor(statusCode: number, message: string, errors: any = null, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.errors = errors;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestException extends HttpException {
  constructor(message = "Bad Request", errors: any = null) {
    super(StatusCodes.BAD_REQUEST, message, errors);
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message = "Unauthorized") {
    super(StatusCodes.UNAUTHORIZED, message);
  }
}

export class ForbiddenException extends HttpException {
  constructor(message = "Forbidden") {
    super(StatusCodes.FORBIDDEN, message);
  }
}

export class NotFoundException extends HttpException {
  constructor(message = "Not Found") {
    super(StatusCodes.NOT_FOUND, message);
  }
}

export class InternalServerException extends HttpException {
  constructor(message = "Internal Server Error") {
    super(StatusCodes.INTERNAL_SERVER_ERROR, message, null, false);
  }
}
