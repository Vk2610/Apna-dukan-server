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
} from "../dao/auth.dao.js";

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

  return user;
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
