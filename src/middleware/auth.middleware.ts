import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

interface AccessTokenPayload extends jwt.JwtPayload {
  sub?: string;
}

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authorization = req.headers.authorization;
  const accessSecret = process.env.JWT_ACCESS_SECRET;

  if (!authorization?.startsWith("Bearer ") || !accessSecret) {
    return res.status(401).json({
      success: false,
      code: "UNAUTHORIZED",
      message: "Authentication required.",
    });
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    return res.status(401).json({
      success: false,
      code: "UNAUTHORIZED",
      message: "Authentication required.",
    });
  }

  try {
    const payload = jwt.verify(token, accessSecret) as AccessTokenPayload;

    if (typeof payload.sub !== "string" || !payload.sub) {
      throw new Error("INVALID_ACCESS_TOKEN");
    }

    req.auth = { userId: payload.sub };
    next();
  } catch {
    return res.status(401).json({
      success: false,
      code: "UNAUTHORIZED",
      message: "Invalid or expired access token.",
    });
  }
};
