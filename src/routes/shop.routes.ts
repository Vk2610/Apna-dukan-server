import { Router } from "express";
import {
  createShopProfile,
  getMyShop,
  updateMyShop,
} from "../controllers/shop.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);
router.post("/", createShopProfile);
router.get("/me", getMyShop);
router.patch("/me", updateMyShop);

export default router;
