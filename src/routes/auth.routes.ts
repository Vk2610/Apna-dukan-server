

import { Router } from "express";
import {
  register,
  login,
  refresh,
  logout,
  verifyEmail,
  verifyEmailWeb,
  resendVerification,
} from "../controllers/auth.controller.js";

const router = Router();

// Register a new user
router.post("/register", register);

// Login an existing user
router.post("/login", login);

// Refresh access and refresh tokens
router.post("/refresh", refresh);

// Logout a user
router.post("/logout", logout);

// Verify email via direct API call (POST)
router.post("/verify-email", verifyEmail);

// Verify email via browser link click (GET)
router.get("/verify-email", verifyEmailWeb);

// Resend verification email
router.post("/resend-verification", resendVerification);

export default router;