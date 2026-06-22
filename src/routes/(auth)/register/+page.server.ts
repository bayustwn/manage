import { superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { registerSchema } from "$lib/schemas/auth";
import { googleEnabled } from "$lib/server/config";

export const load = async () => {
  return {
    form: await superValidate(zod4(registerSchema)),
    googleEnabled,
  };
};
