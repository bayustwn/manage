import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.session) {
    redirect(302, "/login");
  }

  return {
    user: {
      id: locals.user!.id,
      email: locals.user!.email,
      name: locals.user!.name,
      image: locals.user!.image,
      emailVerified: locals.user!.emailVerified,
    },
  };
};