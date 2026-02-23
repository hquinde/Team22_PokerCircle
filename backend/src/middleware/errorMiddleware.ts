import { NextFunction, Request, Response } from "express";

export function notFound(req: Request, res: Response, next: NextFunction) {
  res.status(404).json({ error: "Not Found" });
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // If headers already sent, let Express handle it
  if (res.headersSent) return next(err);

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  const message =
    err && typeof err.message === "string" && err.message.length > 0
      ? err.message
      : "Internal Server Error";

  res.status(statusCode).json({ error: message });
}