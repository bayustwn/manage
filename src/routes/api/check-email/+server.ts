import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { prisma } from "$lib/server/db";

export const GET: RequestHandler = async ({ url }) => {
  const email = url.searchParams.get("email");

  if (!email) {
    return json({ exists: false }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });

  return json({ exists: !!user });
};