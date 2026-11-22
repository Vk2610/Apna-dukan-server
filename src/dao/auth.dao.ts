import prisma from "../config/prisma.js";

interface CreateUserInput {
  name: string;
  email: string;
  passwordHash: string;
  tokenHash: string;
  expiresAt: Date;
}

// Find a user by email
export const findUserByEmail = (email: string) => {
  return prisma.user.findUnique({
    where: { email },
  });
};

// Create user, email identity and verification token
export const createUserWithEmailIdentityAndVerificationToken = (
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

      emailVerificationTokens: {
        create: {
          tokenHash: input.tokenHash,
          expiresAt: input.expiresAt,
        },
      },
    },

    // Return only safe user information
    select: {
      id: true,
      name: true,
      email: true,
      emailVerifiedAt: true,
      createdAt: true,
    },
  });
};
