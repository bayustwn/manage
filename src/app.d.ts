import type { UserRole } from "$generated/prisma/client";

declare global {
  namespace App {
    interface Locals {
      user?: App.SessionUser;
      session?: {
        id: string;
        userId: string;
        token: string;
        expiresAt: Date;
      };
    }

    interface SessionUser {
      id: string;
      name: string;
      email: string;
      emailVerified: boolean;
      role?: UserRole;
      image?: string | null;
    }

    namespace Superforms {
      type Message = string;
    }
  }
}

export {};
