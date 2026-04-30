"use server";

import { cookies } from "next/headers";
import { randomBytes, randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

const GUEST_SESSION_DAYS = 30;

/**
 * Creates a fresh anonymous user + database session and sets the Auth.js
 * session cookie directly. Auth.js v5 with PrismaAdapter reads the cookie,
 * looks up the Session row, and hands us the user — no special path needed
 * elsewhere. Guests are flagged so we can offer "claim this account" later.
 */
export async function continueAsGuest() {
  const guestId = randomUUID();
  const user = await prisma.user.create({
    data: {
      email: `guest-${guestId}@guest.bedtimestory.local`,
      name: "Guest",
      isGuest: true,
    },
    select: { id: true },
  });

  const sessionToken = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + GUEST_SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: { sessionToken, userId: user.id, expires },
  });

  const isProd = process.env.NODE_ENV === "production";
  const cookieStore = await cookies();
  cookieStore.set({
    name: isProd ? "__Secure-authjs.session-token" : "authjs.session-token",
    value: sessionToken,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires,
    secure: isProd,
  });

  redirect("/new");
}
