import { randomUUID } from "node:crypto";
import type { Handle, HandleServerError } from "@sveltejs/kit";
import { building, dev } from "$app/environment";
import { auth } from "$lib/server/auth";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { validateEnv } from "$lib/server/env";

validateEnv();

export const handle: Handle = async ({ event, resolve }) => {
  if (building) return resolve(event);

  // Populate locals with session for SSR — avoids redundant getSession di layouts
  const url = new URL(event.request.url);
  if (!url.pathname.startsWith("/api/")) {
    const s = await auth.api.getSession({
      headers: event.request.headers,
    });
    if (s?.session) {
      event.locals.session = s.session;
      event.locals.user = s.user;
    }
  }

  return svelteKitHandler({ event, resolve, auth, building });
};

export const handleError: HandleServerError = ({ error, event }) => {
  const id = randomUUID();

  console.error({ id, url: event.url.pathname, error });

  return {
    message: "Internal server error",
    ...(dev && { id }),
  };
};
