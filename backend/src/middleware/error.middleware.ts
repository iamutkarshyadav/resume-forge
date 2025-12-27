import { Request, Response, NextFunction } from "express";

/**
 * Global error handler for Express
 *
 * IMPORTANT: This only handles REST endpoints, not tRPC
 * tRPC errors are handled by the tRPC middleware and must always be valid tRPC responses
 */
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error("Express error handler:", err);

  // Ensure we never send an empty or malformed response
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Safety: ensure status is a valid HTTP status code
  const safeStatus = Number.isInteger(status) && status >= 400 && status < 600 ? status : 500;

  if (message === "Gemini API error") {
    return res.status(safeStatus).json({
      error: "Gemini API error",
      details: err.details || null
    });
  }

  // Standard REST error shape (not tRPC format - that's handled by tRPC middleware)
  return res.status(safeStatus).json({
    message,
    details: err.details || null
  });
}
