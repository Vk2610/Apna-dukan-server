import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { createHash, randomBytes } from "node:crypto";

import {
  findUserByEmail,
  createUserWithEmailIdentity,
  createRefreshToken,
  findRefreshTokenByHash,
  rotateRefreshToken,
  revokeRefreshToken,
  createVerificationToken,
  findVerificationTokenByHash,
  findLatestVerificationTokenByUserId,
  deleteVerificationTokensByUserId,
  verifyUserEmail,
} from "../dao/auth.dao.js";
import { sendVerificationEmail } from "./email.services.js";

// Registration input
interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

// Login input
interface LoginInput {
  email: string;
  password: string;
}

// Generate a new access token
const generateAccessToken = (userId: string) => {
  const accessSecret = process.env.JWT_ACCESS_SECRET;

  if (!accessSecret) {
    throw new Error("JWT_SECRET_MISSING");
  }

  return jwt.sign(
    { sub: userId },
    accessSecret,
    { expiresIn: "15m" }
  );
};

// Generate a random refresh token
const generateRefreshToken = () => {
  return randomBytes(64).toString("hex");
};

// Hash refresh token using SHA-256
const hashRefreshToken = (refreshToken: string) => {
  return createHash("sha256")
    .update(refreshToken)
    .digest("hex");
};

// Calculate refresh token expiry (30 days)
const getRefreshTokenExpiry = () => {
  return new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000
  );
};

// Generate cryptographically secure verification token
const generateVerificationToken = () => {
  return randomBytes(32).toString("hex");
};

// Hash verification token using SHA-256
const hashVerificationToken = (token: string) => {
  return createHash("sha256").update(token).digest("hex");
};

// Calculate verification token expiry (15 minutes)
const getVerificationTokenExpiry = () => {
  return new Date(Date.now() + 15 * 60 * 1000);
};

// REGISTER USER
export const registerUser = async (input: RegisterInput) => {
  const normalizedEmail = input.email.trim().toLowerCase();

  const existingUser = await findUserByEmail(normalizedEmail);

  if (existingUser) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  const passwordHash = await argon2.hash(input.password, {
    type: argon2.argon2id,
  });

  const user = await createUserWithEmailIdentity({
    name: input.name.trim(),
    email: normalizedEmail,
    passwordHash,
  });

  // Generate cryptographically secure verification token
  const rawToken = generateVerificationToken();
  const tokenHash = hashVerificationToken(rawToken);
  const expiresAt = getVerificationTokenExpiry();

  // Store only its SHA-256 hash in database
  await createVerificationToken({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  // Construct verification link
  const baseUrl =
    process.env.APP_URL || process.env.API_BASE_URL || "http://localhost:5000";
  const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${rawToken}`;

  let emailSent = true;
  try {
    await sendVerificationEmail({
      to: user.email,
      name: user.name,
      verificationUrl,
    });
  } catch (emailError) {
    console.error(
      "Verification email sending failed during registration:",
      emailError
    );
    emailSent = false;
  }

  return {
    user,
    emailSent,
  };
};

// LOGIN USER
export const loginUser = async (input: LoginInput) => {
  const email = input.email.trim().toLowerCase();

  // Find user
  const user = await findUserByEmail(email);

  if (!user || !user.passwordHash) {
    throw new Error("INVALID_CREDENTIALS");
  }

  // Verify password
  const passwordIsValid = await argon2.verify(
    user.passwordHash,
    input.password
  );

  if (!passwordIsValid) {
    throw new Error("INVALID_CREDENTIALS");
  }

  // Generate access token
  const accessToken = generateAccessToken(user.id);

  // Generate refresh token
  const refreshToken = generateRefreshToken();

  // Hash refresh token before storing it
  const tokenHash = hashRefreshToken(refreshToken);

  // Calculate expiry
  const expiresAt = getRefreshTokenExpiry();

  // Store refresh token hash in database
  await createRefreshToken({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt,
    },
    accessToken,
    refreshToken,
  };
};

// REFRESH ACCESS TOKEN
export const refreshAccessToken = async (
  inputRefreshToken: string
) => {
  // Hash the incoming refresh token
  const oldTokenHash = hashRefreshToken(inputRefreshToken);

  // Find token in database
  const storedToken = await findRefreshTokenByHash(oldTokenHash);

  // Check whether token exists, is active and has not expired
  if (
    !storedToken ||
    storedToken.revokedAt ||
    storedToken.expiresAt <= new Date()
  ) {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  // Generate new access token
  const accessToken = generateAccessToken(storedToken.user.id);

  // Generate new refresh token
  const newRefreshToken = generateRefreshToken();

  // Hash the new refresh token
  const newTokenHash = hashRefreshToken(newRefreshToken);

  // Calculate new expiry
  const newExpiresAt = getRefreshTokenExpiry();

  // Revoke old token and save new token
  const rotated = await rotateRefreshToken(
    storedToken.id,
    storedToken.user.id,
    newTokenHash,
    newExpiresAt
  );

  if (!rotated) {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  return {
    accessToken,
    refreshToken: newRefreshToken,
  };
};


export const logoutUser = async (refreshToken: string) => {
  // Hash the refresh token received from the client
  const tokenHash = hashRefreshToken(refreshToken.trim());

  // Revoke the token in the database
  const result = await revokeRefreshToken(tokenHash);

  if (result.count === 0) {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  return true;
};

// VERIFY EMAIL TOKEN
export const verifyEmailToken = async (rawToken: string) => {
  const tokenHash = hashVerificationToken(rawToken.trim());

  const storedToken = await findVerificationTokenByHash(tokenHash);

  if (!storedToken) {
    throw new Error("INVALID_TOKEN");
  }

  if (storedToken.expiresAt <= new Date()) {
    throw new Error("TOKEN_EXPIRED");
  }

  const updatedUser = await verifyUserEmail(
    storedToken.user.id,
    storedToken.id
  );

  if (!updatedUser) {
    throw new Error("INVALID_TOKEN");
  }

  return updatedUser;
};

// RESEND VERIFICATION EMAIL
export const resendVerificationEmail = async (email: string) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await findUserByEmail(normalizedEmail);

  // Return generic response if user doesn't exist (prevent email enumeration)
  if (!user) {
    return { success: true };
  }

  // Do not generate token for already-verified account
  if (user.emailVerifiedAt) {
    return { success: true, alreadyVerified: true };
  }

  // Rate limiting check: minimum 60s between requests
  const latestToken = await findLatestVerificationTokenByUserId(user.id);
  if (
    latestToken &&
    Date.now() - latestToken.createdAt.getTime() < 60 * 1000
  ) {
    throw new Error("RATE_LIMITED");
  }

  // Invalidate previous unused verification tokens
  await deleteVerificationTokensByUserId(user.id);

  // Generate new token
  const rawToken = generateVerificationToken();
  const tokenHash = hashVerificationToken(rawToken);
  const expiresAt = getVerificationTokenExpiry();

  await createVerificationToken({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  const baseUrl =
    process.env.APP_URL || process.env.API_BASE_URL || "http://localhost:5000";
  const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${rawToken}`;

  try {
    await sendVerificationEmail({
      to: user.email,
      name: user.name,
      verificationUrl,
    });
  } catch (emailError) {
    console.error("Verification email sending failed during resend:", emailError);
    throw new Error("EMAIL_SEND_FAILED");
  }

  return { success: true };
};

