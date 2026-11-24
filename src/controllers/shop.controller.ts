import type { Request, Response } from "express";
import { Prisma } from "../generated/prisma/client.js";
import {
  createShopForUser,
  getShopForUser,
  updateShopForUser,
} from "../services/shop.services.js";
import {
  createShopSchema,
  updateShopSchema,
} from "../validators/shop.validation.js";

const validationError = (res: Response, errors: unknown) =>
  res.status(400).json({
    success: false,
    code: "INVALID_SHOP_PROFILE",
    message: "Invalid shop profile details.",
    errors,
  });

const ownerUserIdFrom = (req: Request) => req.auth!.userId;

const isUniqueOwnerConstraint = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === "P2002";

export const createShopProfile = async (req: Request, res: Response) => {
  const validation = createShopSchema.safeParse(req.body);

  if (!validation.success) {
    return validationError(res, validation.error.flatten().fieldErrors);
  }

  try {
    const shop = await createShopForUser(ownerUserIdFrom(req), validation.data);

    return res.status(201).json({
      success: true,
      message: "Shop profile created successfully.",
      data: shop,
    });
  } catch (error) {
    if (
      (error instanceof Error && error.message === "SHOP_ALREADY_EXISTS") ||
      isUniqueOwnerConstraint(error)
    ) {
      return res.status(409).json({
        success: false,
        code: "SHOP_ALREADY_EXISTS",
        message: "A shop profile already exists for this account.",
      });
    }

    console.error("Create shop profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating the shop profile.",
    });
  }
};

export const getMyShop = async (req: Request, res: Response) => {
  try {
    const shop = await getShopForUser(ownerUserIdFrom(req));

    return res.status(200).json({
      success: true,
      data: shop,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "SHOP_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        code: "SHOP_NOT_FOUND",
        message: "No shop profile exists for this account.",
      });
    }

    console.error("Get shop profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while retrieving the shop profile.",
    });
  }
};

export const updateMyShop = async (req: Request, res: Response) => {
  const validation = updateShopSchema.safeParse(req.body);

  if (!validation.success) {
    return validationError(res, validation.error.flatten().fieldErrors);
  }

  try {
    const shop = await updateShopForUser(ownerUserIdFrom(req), validation.data);

    return res.status(200).json({
      success: true,
      message: "Shop profile updated successfully.",
      data: shop,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "SHOP_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        code: "SHOP_NOT_FOUND",
        message: "No shop profile exists for this account.",
      });
    }

    console.error("Update shop profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating the shop profile.",
    });
  }
};
