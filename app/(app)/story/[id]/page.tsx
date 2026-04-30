import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { StoryStatusGate } from "@/components/StoryStatusGate";
import { ResilientImage } from "@/components/ResilientImage";
import Link from "next/link";

export default async function StoryPage({
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

  if (story.status !== "READY") {
    return <StoryStatusGate id={story.id} initialStatus={story.status} />;
  }

  const cover = story.scenes[0]?.imageUrl;

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <Link href="/dashboard" className="text-ink/60 hover:text-ink">
        ← All stories
      </Link>
      <h1 className="font-display text-4xl md:text-5xl font-bold mt-4">
        {story.title}
      </h1>
      <p className="text-ink/60 mt-2">
        For {story.childName} · {story.scenes.length} scenes
      </p>

      {cover && (
        <div className="relative aspect-[16/9] mt-6 rounded-blob overflow-hidden shadow-soft">
          <ResilientImage
            src={cover}
            alt={story.title || "Story cover"}
            priority
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <Link
          href={`/story/${story.id}/video`}
          className="card hover:-translate-y-1 transition-transform group p-8 text-center"
        >
          <div className="text-6xl mb-4 group-hover:animate-float">🎬</div>
          <h2 className="text-2xl font-bold">Watch as a video</h2>
          <p className="text-ink/60 mt-2">
            Auto-playing slideshow with the narrator&apos;s voice and gentle music.
          </p>
        </Link>
        <Link
          href={`/story/${story.id}/book`}
          className="card hover:-translate-y-1 transition-transform group p-8 text-center"
        >
          <div className="text-6xl mb-4 group-hover:animate-float">📖</div>
          <h2 className="text-2xl font-bold">Read as a book</h2>
          <p className="text-ink/60 mt-2">
            Swipe page by page. Tap &ldquo;Read to me&rdquo; for the narrator on
            any page.
          </p>
        </Link>
      </div>
    </main>
  );
}
