import { superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { loginSchema } from "$lib/schemas/auth";

export const load = async () => {
  return {
    form: await superValidate(zod4(loginSchema)),
  };
};
