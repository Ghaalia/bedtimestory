import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const story = await prisma.story.findUnique({
    where: { id },
    include: { scenes: { orderBy: { index: "asc" } } },
  });

  if (!story) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (story.userId !== session.user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({ story });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const story = await prisma.story.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!story) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (story.userId !== session.user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  await prisma.story.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
