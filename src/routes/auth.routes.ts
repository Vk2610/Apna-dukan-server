

import { Router } from "express";
import { register, login, refresh, logout } from "../controllers/auth.controller";

const router = Router();

// Register a new user
router.post("/register", register);

// Login an existing user
router.post("/login", login);

// Refresh access and refresh tokens
router.post("/refresh", refresh);

// Logout a user
router.post("/logout", logout);

export default router;