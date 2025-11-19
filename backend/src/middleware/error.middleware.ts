import { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error(err);
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  if (message === "Gemini API error") {
    return res.status(status).json({ error: "Gemini API error", details: err.details || null });
  }

  // Standard error shape
  res.status(status).json({ message, details: err.details || null });
}
