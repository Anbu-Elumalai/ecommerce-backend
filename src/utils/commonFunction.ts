import ApiError from "./error";

function handleErrorResponse(error: any, res: any) {

  if (res.headersSent) {
    return;
  }
  if (error?.code === 11000) {

    let field = "field";
    let value = "";
    if (error.keyValue) {
      field = Object.keys(error.keyValue)[0];
      value = error.keyValue[field];
    }
    else if (typeof error.message === "string") {
      const match = error.message.match(/\{ (.+?): \"(.+?)\" \}/);
      if (match) {
        field = match[1];
        value = match[2];
      }
    }

    return res.status(409).json({
      status: "error",
      message: `${field} '${value}' already exists`
    });
  }

  if (error instanceof ApiError) {
    return res
      .status(error.statusCode)
      .json(error.toResponse());
  }

  const statusCode = error.statusCode || error.httpCode;
  const isJwtError =
    error.name === "JsonWebTokenError" ||
    error.name === "TokenExpiredError" ||
    (typeof error.message === "string" && (
      error.message.toLowerCase().includes("jwt") ||
      error.message.toLowerCase().includes("token")
    ));

  const finalStatus = isJwtError ? 401 : (statusCode || 500);

  return res.status(finalStatus).json({
    status: "error",
    message: error.message || "Internal Server Error"
  });
}

export default handleErrorResponse;
