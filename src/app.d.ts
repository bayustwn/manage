import type { UserRole } from "$generated/prisma/client";

declare global {
  namespace App {
    interface Locals {
      user?: {
        id: string;
        name: string;
        email: string;
        emailVerified: boolean;
        role: UserRole;
        image?: string | null;
      };
      session?: {
        id: string;
        userId: string;
        token: string;
        expiresAt: Date;
      };
    }
  }
}

export {};
