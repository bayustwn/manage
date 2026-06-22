import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ url }) => {
  const token = url.searchParams.get("token");

  if (token) {
    redirect(302, `/api/auth/verify-email?${url.searchParams.toString()}`);
  }

  return {
    email: url.searchParams.get("email") || "your email",
  };
};
