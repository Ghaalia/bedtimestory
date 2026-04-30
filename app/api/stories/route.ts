import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { runPipeline } from "@/lib/ai/pipeline";
import { waitUntil } from "@vercel/functions";

// Stable Horde generations can take 1-3 min. We need this much headroom on
// Vercel; on Hobby this is the maximum allowed (60s — pipeline must run via
// waitUntil so it survives past the response shipping).
export const maxDuration = 60;

const Body = z.object({
  childName: z.string().min(1).max(40),
  childAge: z.number().int().min(2).max(12).optional(),
  funnyThing: z.string().min(2).max(500),
  niceThing: z.string().min(2).max(500),
  badThing: z.string().min(2).max(500),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const story = await prisma.story.create({
    data: {
      userId: session.user.id,
      childName: parsed.data.childName,
      childAge: parsed.data.childAge,
      funnyThing: parsed.data.funnyThing,
      niceThing: parsed.data.niceThing,
      badThing: parsed.data.badThing,
    },
    select: { id: true },
  });

  // Fire-and-forget: drive the pipeline in the background. We intentionally do
  // not await so the response returns instantly; the client polls for status.
  // waitUntil() keeps the function alive on Vercel after the response ships.
  waitUntil(runPipeline(story.id));

  return NextResponse.json({ id: story.id }, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const stories = await prisma.story.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      mood: true,
      status: true,
      createdAt: true,
      scenes: {
        orderBy: { index: "asc" },
        take: 1,
        select: { imageUrl: true },
      },
    },
  });

  return NextResponse.json({ stories });
}
