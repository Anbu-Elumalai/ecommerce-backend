import { ExpressErrorMiddlewareInterface, Middleware, BadRequestError } from "routing-controllers";
import { StatusCodes } from "http-status-codes";

@Middleware({ type: "after" })
export class ErrorMiddleware implements ExpressErrorMiddlewareInterface {
  error(error: any, req: any, res: any, next: (err?: any) => any) {
    if (res.headersSent) {
      return next();
    }

    const isProd = process.env.NODE_ENV === "production";
    let statusCode = error.statusCode || error.httpCode || StatusCodes.INTERNAL_SERVER_ERROR;
    let message = error.message || "Internal Server Error";
    let errors: any = error.errors || null;

    // Handle class-validator BadRequestError (cast to any for type-safety)
    const err = error as any;
    if (error instanceof BadRequestError && Array.isArray(err.errors)) {
      statusCode = StatusCodes.BAD_REQUEST;
      message = "Validation failed";
      errors = err.errors.map((e: any) => ({
        field: e.property,
        value: e.value,
        message: e.constraints ? Object.values(e.constraints)[0] : "Invalid value"
      }));
    }

    // Handle MongoDB Duplicate Key (11000)
    if (error.code === 11000) {
      statusCode = StatusCodes.CONFLICT;
      let field = "field";
      let value = "";
      if (error.keyValue) {
        field = Object.keys(error.keyValue)[0];
        value = error.keyValue[field];
      }
      message = `${field} '${value}' already exists`;
      errors = { [field]: `${field} already exists` };
    }

    // Log unhandled server errors (500s)
    if (statusCode === StatusCodes.INTERNAL_SERVER_ERROR) {
      console.error("🔥 [Unhandled Error]:", error);
      if (isProd) {
        message = "An unexpected error occurred.";
      }
    }

    return res.status(statusCode).json({
      status: statusCode >= 400 && statusCode < 500 ? "fail" : "error",
      statusCode,
      message,
      ...(errors && { errors }),
      ...(!isProd && { stack: error.stack })
    });
  }
}
