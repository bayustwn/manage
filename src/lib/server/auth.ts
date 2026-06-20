import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { getRequestEvent } from "$app/server";
import { prisma } from "$lib/server/db";
import { sendEmail } from "$lib/server/email";
import {
  BETTER_AUTH_URL,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
} from "$env/static/private";

export const auth = betterAuth({
  baseURL: BETTER_AUTH_URL,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      try {
        await sendEmail({
          to: user.email,
          subject: "Reset your password",
          text: `Click the link to reset your password: ${url}`,
        });
      } catch (err) {
        console.error("Failed to send password reset email:", err);
      }
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      try {
        await sendEmail({
          to: user.email,
          subject: "Verify your email address",
          text: `Click the link to verify your email: ${url}`,
        });
      } catch (err) {
        console.error("Failed to send verification email:", err);
      }
    },
  },
  socialProviders: GOOGLE_CLIENT_ID
    ? {
        google: {
          clientId: GOOGLE_CLIENT_ID,
          clientSecret: GOOGLE_CLIENT_SECRET,
          redirectURI: "http://localhost:5173/callback/google",
        },
      }
    : undefined,
  trustedOrigins: [BETTER_AUTH_URL],
  plugins: [sveltekitCookies(getRequestEvent)],
});
