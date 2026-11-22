

import { Router } from "express";

import {
  register,
  login,
  refresh,
} from "../controllers/auth.controller";

const router = Router();

// Register a new user
router.post("/register", register);

// Login an existing user
router.post("/login", login);

// Refresh access and refresh tokens
router.post("/refresh", refresh);

export default router;

