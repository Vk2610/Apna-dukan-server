
import { Request, Response } from "express";
import { z } from "zod";

import {
  registerUser,
  loginUser,
  refreshAccessToken,
} from "../services/auth.services.js";

// Registration validation
const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
});

// Login validation
const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128),
});

// Refresh token validation
const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

// REGISTER CONTROLLER
export const register = async (req: Request, res: Response) => {
  const validation = registerSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid registration details.",
      errors: validation.error.flatten().fieldErrors,
    });
  }

  try {
    const user = await registerUser(validation.data);

    return res.status(201).json({
      success: true,
      message: "Account created successfully.",
      data: user,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "EMAIL_ALREADY_EXISTS"
    ) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    console.error("Registration error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong during registration.",
    });
  }
};

// LOGIN CONTROLLER
export const login = async (req: Request, res: Response) => {
  const validation = loginSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid login details.",
      errors: validation.error.flatten().fieldErrors,
    });
  }

  try {
    const result = await loginUser(validation.data);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: result,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "INVALID_CREDENTIALS"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong during login.",
    });
  }
};

// REFRESH TOKEN CONTROLLER
export const refresh = async (req: Request, res: Response) => {
  const validation = refreshSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Refresh token is required.",
    });
  }

  try {
    const result = await refreshAccessToken(
      validation.data.refreshToken
    );

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully.",
      data: result,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "INVALID_REFRESH_TOKEN"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token.",
      });
    }

    console.error("Token refresh error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while refreshing the token.",
    });
  }
};
