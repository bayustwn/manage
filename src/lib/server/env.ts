import { building } from "$app/environment";
import {
  DATABASE_URL,
  POSTGRES_PASSWORD,
  BETTER_AUTH_SECRET,
  BETTER_AUTH_URL,
  RESEND_API_KEY,
  EMAIL_FROM,
  PGADMIN_PASSWORD,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
} from "$env/static/private";

const required: Record<string, string | undefined> = {
  DATABASE_URL,
  POSTGRES_PASSWORD,
  BETTER_AUTH_SECRET,
  BETTER_AUTH_URL,
};

const optional: Record<string, string | undefined> = {
  RESEND_API_KEY,
  EMAIL_FROM,
  PGADMIN_PASSWORD,
};

export function validateEnv() {
  if (building) return;

  const missing = Object.entries(required)
    .filter(([_, v]) => !v)
    .map(([k]) => k);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n  ${missing.join("\n  ")}`,
    );
  }

  if (BETTER_AUTH_SECRET && BETTER_AUTH_SECRET.length < 32) {
    throw new Error(
      "BETTER_AUTH_SECRET must be at least 32 characters long",
    );
  }

  if (GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_SECRET) {
    console.warn(
      "GOOGLE_CLIENT_ID is set but GOOGLE_CLIENT_SECRET is missing. Google sign-in will be disabled.",
    );
  }

  if (!GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    console.warn(
      "GOOGLE_CLIENT_SECRET is set but GOOGLE_CLIENT_ID is missing. Google sign-in will be disabled.",
    );
  }
}
