import prisma from "../config/prisma.js";
import type {
  CreateShopInput,
  UpdateShopInput,
} from "../validators/shop.validation.js";

export const findShopByOwnerUserId = (ownerUserId: string) =>
  prisma.shop.findUnique({ where: { ownerUserId } });

export const createShop = (ownerUserId: string, input: CreateShopInput) =>
  prisma.shop.create({
    data: {
      ownerUserId,
      ...input,
    },
  });

export const updateShopByOwnerUserId = (
  ownerUserId: string,
  input: UpdateShopInput
) =>
  prisma.shop.update({
    where: { ownerUserId },
    data: input,
  });
