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
  if (res.headersSent) return next(err);

  // IMPORTANT: log the full error so you can see pg errors, stack, etc.
  console.error("Unhandled error:", err);

  // Express JSON body parse errors (malformed JSON)
  // express.json() sets err.type = 'entity.parse.failed'
  const errAny = err as any;
  if (err instanceof SyntaxError && errAny && errAny.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  const status =
    typeof err?.statusCode === "number"
      ? err.statusCode
      : typeof err?.status === "number"
      ? err.status
      : 500;

  const message =
    err && typeof err.message === "string" && err.message.length > 0
      ? err.message
      : "Internal Server Error";

  // Optional (nice for dev): include stack
  const payload =
    process.env.NODE_ENV !== "production"
      ? { error: message, stack: err?.stack }
      : { error: message };

  res.status(status).json(payload);
}