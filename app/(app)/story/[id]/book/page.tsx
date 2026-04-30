import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BookReader } from "@/components/player/BookReader";

export default async function BookStoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const story = await prisma.story.findUnique({
    where: { id },
    include: { scenes: { orderBy: { index: "asc" } } },
  });
  if (!story) notFound();
  if (story.userId !== session.user.id) notFound();
  if (story.status !== "READY") redirect(`/story/${id}`);

  return (
    <BookReader
      title={story.title || "A bedtime story"}
      backHref={`/story/${id}`}
      pages={story.scenes
        .filter((s) => s.imageUrl)
        .map((s) => ({
          imageUrl: s.imageUrl!,
          text: s.text,
        }))}
    />
  );
}
