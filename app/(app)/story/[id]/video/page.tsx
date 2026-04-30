import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { VideoPlayer } from "@/components/player/VideoPlayer";
import { musicForMood } from "@/lib/music";

export default async function VideoStoryPage({
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
    <VideoPlayer
      title={story.title || "A bedtime story"}
      musicSrc={musicForMood(story.mood)}
      backHref={`/story/${id}`}
      scenes={story.scenes
        .filter((s) => s.imageUrl)
        .map((s) => ({
          imageUrl: s.imageUrl!,
          text: s.text,
          durationMs: s.durationMs ?? 6000,
        }))}
    />
  );
}
