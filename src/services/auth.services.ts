
import argon2 from "argon2";
import { createHash, randomBytes } from "node:crypto";

import {
  findUserByEmail,
  createUserWithEmailIdentityAndVerificationToken,
} from "../dao/auth.dao";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export const registerUser = async (input: RegisterInput) => {
  const normalizedEmail = input.email.trim().toLowerCase();

  // Check whether the email is already registered
  const existingUser = await findUserByEmail(normalizedEmail);

  if (existingUser) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  // Hash the password using Argon2id
  const passwordHash = await argon2.hash(input.password, {
    type: argon2.argon2id,
  });

  // Generate a cryptographically secure verification token
  const verificationToken = randomBytes(32).toString("hex");

  // Store only the SHA-256 hash of the token
  const tokenHash = createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  // Verification link expires after 30 minutes
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  // Create user, identity and verification token
  const user = await createUserWithEmailIdentityAndVerificationToken({
    name: input.name.trim(),
    email: normalizedEmail,
    passwordHash,
    tokenHash,
    expiresAt,
  });

  return user;
};
