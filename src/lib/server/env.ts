import { building } from "$app/environment";

const required = [
  "DATABASE_URL",
  "POSTGRES_PASSWORD",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
] as const;

const optional = ["RESEND_API_KEY", "EMAIL_FROM", "PGADMIN_PASSWORD"] as const;

export function validateEnv() {
  if (building) return;

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n  ${missing.join("\n  ")}`,
    );
  }

  if (
    process.env.BETTER_AUTH_SECRET &&
    process.env.BETTER_AUTH_SECRET.length < 32
  ) {
    throw new Error(
      "BETTER_AUTH_SECRET must be at least 32 characters long",
    );
  }
}
