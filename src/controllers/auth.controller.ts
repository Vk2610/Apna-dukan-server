
import { Request, Response } from "express";
import { z } from "zod";
import { registerUser } from "../services/auth.services";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
});

export const register = async (req: Request, res: Response) => {
  // Validate incoming request data
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
      message: "Registration successful. Please verify your email.",
      data: user,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "EMAIL_ALREADY_EXISTS") {
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
