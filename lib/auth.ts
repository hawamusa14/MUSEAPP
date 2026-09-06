import { cache } from "react";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { hasDatabaseUrl } from "@/lib/env";
import { ActionError } from "@/lib/errors";

export const getSession = cache(async () => {
  const { userId } = await auth();
  if (!userId) return null;
  return { clerkUserId: userId };
});

export const requireUser = cache(async () => {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  if (!hasDatabaseUrl()) {
    throw new ActionError(
      "DATABASE_URL is not configured. Add it to .env.local to continue."
    );
  }

  const clerkUser = await currentUser();
  const email =
    clerkUser?.primaryEmailAddress?.emailAddress ??
    clerkUser?.emailAddresses[0]?.emailAddress ??
    "";
  const name =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ||
    clerkUser?.username ||
    "MUSE member";

  return prisma.user.upsert({
    where: { clerkUserId: session.clerkUserId },
    create: {
      clerkUserId: session.clerkUserId,
      email,
      name,
      profile: { create: {} },
      settings: { create: {} },
    },
    update: {
      email,
      name,
    },
    include: {
      profile: true,
      settings: true,
    },
  });
});

export type MuseUser = Awaited<ReturnType<typeof requireUser>>;
