import { z } from "zod";

const requiredText = (maxLength: number) =>
  z.string().trim().min(1, "Required.").max(maxLength);

const indianMobileNumber = z
  .string()
  .trim()
  .regex(
    /^(?:\+91[\s-]?|91[\s-]?)?[6-9]\d{9}$/,
    "Please provide a valid Indian mobile number."
  )
  .transform((value) => {
    const digits = value.replace(/\D/g, "");
    return digits.length === 12 && digits.startsWith("91")
      ? digits.slice(2)
      : digits;
  });

const gstin = z
  .string()
  .trim()
  .toUpperCase()
  .regex(
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/,
    "Please provide a valid GSTIN."
  )
  .nullable()
  .optional();

const shopFields = {
  name: requiredText(120),
  ownerName: requiredText(120),
  businessAddress: requiredText(500),
  mobileNumber: indianMobileNumber,
  category: requiredText(120),
  gstin,
};

export const createShopSchema = z.object(shopFields).strict();

export const updateShopSchema = z
  .object({
    name: shopFields.name.optional(),
    ownerName: shopFields.ownerName.optional(),
    businessAddress: shopFields.businessAddress.optional(),
    mobileNumber: shopFields.mobileNumber.optional(),
    category: shopFields.category.optional(),
    gstin,
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one shop profile field is required.",
  });

export type CreateShopInput = z.infer<typeof createShopSchema>;
export type UpdateShopInput = z.infer<typeof updateShopSchema>;
