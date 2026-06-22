import { betterAuth } from "better-auth";
import { createEmailVerificationToken } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { dev } from "$app/environment";
import { getRequestEvent } from "$app/server";
import { googleEnabled, serverConfig } from "$lib/server/config";
import { prisma } from "$lib/server/db";
import { sendEmail } from "$lib/server/email";

// Rate limiting untuk email verification — cegah spam
const emailCooldowns = new Map<string, number>();
const EMAIL_COOLDOWN_MS = 60_000;

function isEmailOnCooldown(email: string): boolean {
  const key = email.toLowerCase();
  const lastSent = emailCooldowns.get(key);
  const now = Date.now();
  if (lastSent && now - lastSent < EMAIL_COOLDOWN_MS) {
    return true;
  }
  emailCooldowns.set(key, now);
  return false;
}

const googleRedirectURI = (() => {
  if (!googleEnabled) return undefined;
  const base = serverConfig.BETTER_AUTH_URL.replace(/\/+$/, "");
  return `${base}/callback/google`;
})();

function toAuthVerifyEmailURL(url: string) {
  const parsed = new URL(url);

  if (parsed.pathname === "/verify-email") {
    parsed.pathname = "/api/auth/verify-email";
  }

  return parsed.toString();
}

export const auth = betterAuth({
  baseURL: serverConfig.BETTER_AUTH_URL,
  secret: serverConfig.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  advanced: {
    useSecureCookies: !dev,
  },
  account: {
    encryptOAuthTokens: true,
    storeStateStrategy: "database",
    skipStateCookieCheck: true,
  },
  verification: {
    storeIdentifier: "hashed",
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    onExistingUserSignUp: async ({ user }) => {
      if (user.emailVerified) return;
      if (isEmailOnCooldown(user.email)) return;

      const token = await createEmailVerificationToken(
        serverConfig.BETTER_AUTH_SECRET,
        user.email,
      );
      const callbackURL = encodeURIComponent("/login");
      const url = `${serverConfig.BETTER_AUTH_URL}/api/auth/verify-email?token=${token}&callbackURL=${callbackURL}`;

      await sendEmail({
        to: user.email,
        subject: "Verify your email address",
        text: `Click the link to verify your email: ${url}`,
      });
    },
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        text: `Click the link to reset your password: ${url}`,
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      if (isEmailOnCooldown(user.email)) return;

      const verificationURL = toAuthVerifyEmailURL(url);

      await sendEmail({
        to: user.email,
        subject: "Verify your email address",
        text: `Click the link to verify your email: ${verificationURL}`,
      });
    },
  },
  socialProviders: googleEnabled
    ? {
        google: {
          clientId: serverConfig.GOOGLE_CLIENT_ID,
          clientSecret: serverConfig.GOOGLE_CLIENT_SECRET,
          redirectURI: googleRedirectURI,
          prompt: "select_account",
        },
      }
    : undefined,
  trustedOrigins: [serverConfig.BETTER_AUTH_URL],
  plugins: [sveltekitCookies(getRequestEvent)],
});
