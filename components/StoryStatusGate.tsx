"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles } from "@/components/animations/Sparkles";

const MESSAGES: Record<string, { emoji: string; text: string }> = {
  PENDING: { emoji: "✨", text: "Sprinkling some bedtime magic…" },
  GENERATING_TEXT: { emoji: "📝", text: "Dreaming up your story…" },
  GENERATING_IMAGES: { emoji: "🎨", text: "Painting the pictures…" },
  GENERATING_VOICE: { emoji: "🎙️", text: "Recording the narrator…" },
  FAILED: { emoji: "😟", text: "Something went sleepy on us." },
};

export function StoryStatusGate({
  id,
  initialStatus,
}: {
  id: string;
  initialStatus: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "READY" || status === "FAILED") return;

    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/stories/${id}`, { cache: "no-store" });
        if (!res.ok) return;
        const { story } = (await res.json()) as {
          story: { status: string; errorMessage: string | null };
        };
        if (cancelled) return;
        setStatus(story.status);
        if (story.errorMessage) setError(story.errorMessage);
        if (story.status === "READY") router.refresh();
      } catch {
        // transient — keep polling
      }
    };
    const interval = setInterval(tick, 2000);
    void tick();
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [id, status, router]);

  const m = MESSAGES[status] ?? MESSAGES.PENDING;
  const failed = status === "FAILED";

  return (
    <main className="relative min-h-[80vh] flex items-center justify-center p-6">
      <Sparkles />
      <div className="card relative z-10 max-w-md w-full text-center">
        <motion.div
          className="text-7xl mb-4 inline-block"
          animate={failed ? {} : { rotate: [0, 8, -8, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          {m.emoji}
        </motion.div>
        <h2 className="font-display text-2xl font-bold mb-2">{m.text}</h2>
        {!failed && (
          <p className="text-ink/60">
            This usually takes about a minute. You can stay on this page.
          </p>
        )}
        {failed && (
          <>
            <p className="text-ink/60 mb-4">
              {error || "Please try again in a moment."}
            </p>
            <button onClick={() => router.push("/new")} className="btn">
              Try a new story
            </button>
          </>
        )}
      </div>
    </main>
  );
}
