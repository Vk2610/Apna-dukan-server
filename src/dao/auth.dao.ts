
import prisma from "../config/prisma.js";

interface CreateUserInput {
  name: string;
  email: string;
  passwordHash: string;
}

interface CreateRefreshTokenInput {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

// Find a user using their email
export const findUserByEmail = (email: string) => {
  return prisma.user.findUnique({
    where: { email },
  });
};

// Create a user and their EMAIL identity
export const createUserWithEmailIdentity = (
  input: CreateUserInput
) => {
  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
      identities: {
        create: {
          provider: "EMAIL",
          providerUserId: input.email,
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerifiedAt: true,
      createdAt: true,
    },
  });
};

// Store a new refresh token hash
export const createRefreshToken = (
  input: CreateRefreshTokenInput
) => {
  return prisma.refreshToken.create({
    data: {
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
    },
  });
};

// Find refresh token using its hash
export const findRefreshTokenByHash = (tokenHash: string) => {
  return prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          emailVerifiedAt: true,
        },
      },
    },
  });
};

// Revoke old refresh token and create a new one
export const rotateRefreshToken = async (
  oldTokenId: string,
  userId: string,
  newTokenHash: string,
  expiresAt: Date
) => {
  return prisma.$transaction(async (tx) => {
    const revoked = await tx.refreshToken.updateMany({
      where: {
        id: oldTokenId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: {
        revokedAt: new Date(),
      },
    });

    // If the token was already revoked or expired, stop
    if (revoked.count !== 1) {
      return false;
    }

    // Save the new refresh token hash
    await tx.refreshToken.create({
      data: {
        userId,
        tokenHash: newTokenHash,
        expiresAt,
      },
    });

    return true;
  });
};

export const revokeRefreshToken = (tokenHash: string) => {
  return prisma.refreshToken.updateMany({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: {
      revokedAt: new Date(),
    },
  });
};

