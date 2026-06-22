import { building, dev } from "$app/environment";
import { env } from "$env/dynamic/private";

function readEnv(name: string) {
  return env[name] ?? "";
}

function isLocalAuthUrl(url: string) {
  try {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

export const serverConfig = {
  DATABASE_URL: readEnv("DATABASE_URL"),
  POSTGRES_PASSWORD: readEnv("POSTGRES_PASSWORD"),
  BETTER_AUTH_SECRET: readEnv("BETTER_AUTH_SECRET"),
  BETTER_AUTH_URL: readEnv("BETTER_AUTH_URL"),
  RESEND_API_KEY: readEnv("RESEND_API_KEY"),
  EMAIL_FROM: readEnv("EMAIL_FROM"),
  PGADMIN_PASSWORD: readEnv("PGADMIN_PASSWORD"),
  GOOGLE_CLIENT_ID: readEnv("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: readEnv("GOOGLE_CLIENT_SECRET"),
};

export const googleEnabled = Boolean(
  serverConfig.GOOGLE_CLIENT_ID && serverConfig.GOOGLE_CLIENT_SECRET,
);

export function validateEnv() {
  if (building) return;

  const required: Record<string, string> = {
    DATABASE_URL: serverConfig.DATABASE_URL,
    POSTGRES_PASSWORD: serverConfig.POSTGRES_PASSWORD,
    BETTER_AUTH_SECRET: serverConfig.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: serverConfig.BETTER_AUTH_URL,
  };

  if (!dev) {
    required.RESEND_API_KEY = serverConfig.RESEND_API_KEY;
    required.EMAIL_FROM = serverConfig.EMAIL_FROM;
  }

  const missing = Object.entries(required)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n  ${missing.join("\n  ")}`,
    );
  }

  if (serverConfig.BETTER_AUTH_SECRET.length < 32) {
    throw new Error("BETTER_AUTH_SECRET must be at least 32 characters long");
  }

  if (!dev && !isLocalAuthUrl(serverConfig.BETTER_AUTH_URL)) {
    const authURL = new URL(serverConfig.BETTER_AUTH_URL);

    if (authURL.protocol !== "https:") {
      throw new Error("BETTER_AUTH_URL must use https in production");
    }
  }

  const hasGoogleClient = Boolean(serverConfig.GOOGLE_CLIENT_ID);
  const hasGoogleSecret = Boolean(serverConfig.GOOGLE_CLIENT_SECRET);

  if (hasGoogleClient !== hasGoogleSecret) {
    const message =
      "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be configured together.";

    if (dev) {
      console.warn(`${message} Google sign-in will be disabled.`);
    } else {
      throw new Error(message);
    }
  }
}
