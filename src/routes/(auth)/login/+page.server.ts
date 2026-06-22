import type { PageServerLoad } from "./$types";
import { superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { loginSchema } from "$lib/schemas/auth";
import { googleEnabled } from "$lib/server/config";

export const load: PageServerLoad = async () => {
  return {
    form: await superValidate(zod4(loginSchema)),
    googleEnabled,
  };
};
