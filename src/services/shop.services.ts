import {
  createShop,
  findShopByOwnerUserId,
  updateShopByOwnerUserId,
} from "../dao/shop.dao.js";
import type {
  CreateShopInput,
  UpdateShopInput,
} from "../validators/shop.validation.js";

export const createShopForUser = async (
  ownerUserId: string,
  input: CreateShopInput
) => {
  const existingShop = await findShopByOwnerUserId(ownerUserId);

  if (existingShop) {
    throw new Error("SHOP_ALREADY_EXISTS");
  }

  return createShop(ownerUserId, input);
};

export const getShopForUser = async (ownerUserId: string) => {
  const shop = await findShopByOwnerUserId(ownerUserId);

  if (!shop) {
    throw new Error("SHOP_NOT_FOUND");
  }

  return shop;
};

export const updateShopForUser = async (
  ownerUserId: string,
  input: UpdateShopInput
) => {
  const existingShop = await findShopByOwnerUserId(ownerUserId);

  if (!existingShop) {
    throw new Error("SHOP_NOT_FOUND");
  }

  return updateShopByOwnerUserId(ownerUserId, input);
};
