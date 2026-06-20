import type { Handle, HandleServerError } from "@sveltejs/kit";
import { building } from "$app/environment";
import { auth } from "$lib/server/auth";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { validateEnv } from "$lib/server/env";

validateEnv();

export const handle: Handle = async ({ event, resolve }) => {
  return svelteKitHandler({ event, resolve, auth, building });
};

export const handleError: HandleServerError = ({ error, event }) => {
  const id = crypto.randomUUID();

  console.error(JSON.stringify({ id, url: event.url.pathname, error }));

  return {
    message: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { id }),
  };
};
