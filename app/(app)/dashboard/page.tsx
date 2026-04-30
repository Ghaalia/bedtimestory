import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ResilientImage } from "@/components/ResilientImage";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const stories = await prisma.story.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      scenes: {
        orderBy: { index: "asc" },
        take: 1,
        select: { imageUrl: true },
      },
    },
  });

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold">Your stories</h1>
          <p className="text-ink/60 mt-1">
            Tap one to read or watch — or start a new one tonight.
          </p>
        </div>
        <Link href="/new" className="btn text-lg">
          ✨ New story
        </Link>
      </div>

      {stories.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-6xl mb-4">📖</div>
          <h2 className="text-2xl font-bold mb-2">No stories yet</h2>
          <p className="text-ink/60 mb-6">
            Sit with your child and answer three little questions about their day.
          </p>
          <Link href="/new" className="btn">
            Start the first story
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((s) => {
            const cover = s.scenes[0]?.imageUrl;
            return (
              <Link
                href={`/story/${s.id}`}
                key={s.id}
                className="card hover:-translate-y-1 transition-transform group overflow-hidden p-0"
              >
                <div className="relative aspect-[4/3] bg-lavender/30 overflow-hidden">
                  {cover ? (
                    <ResilientImage
                      src={cover}
                      alt={s.title || "Story cover"}
                      className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-5xl">
                      {statusEmoji(s.status)}
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="font-display text-xl font-bold line-clamp-1">
                    {s.title || "A new story is being born…"}
                  </h3>
                  <p className="text-ink/60 text-sm mt-1">
                    For {s.childName} ·{" "}
                    {s.status === "READY"
                      ? new Date(s.createdAt).toLocaleDateString()
                      : statusLabel(s.status)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}

function statusEmoji(status: string) {
  if (status === "FAILED") return "😟";
  if (status === "READY") return "📖";
  return "✨";
}

function statusLabel(status: string) {
  switch (status) {
    case "GENERATING_TEXT":
      return "Writing…";
    case "GENERATING_IMAGES":
      return "Painting pictures…";
    case "GENERATING_VOICE":
      return "Recording narrator…";
    case "FAILED":
      return "Something went wrong";
    case "PENDING":
      return "Getting ready…";
    default:
      return "Almost there…";
  }
}
