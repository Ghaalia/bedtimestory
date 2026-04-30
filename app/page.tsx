import Link from "next/link";
import { Sparkles, FloatingClouds } from "@/components/animations/Sparkles";
import { auth } from "@/lib/auth";
import { continueAsGuest } from "@/app/actions/guest";

export default async function LandingPage() {
  const session = await auth();

  return (
    <main className="relative min-h-screen overflow-hidden">
      <FloatingClouds />
      <Sparkles />

      <nav className="relative z-10 flex items-center justify-between px-8 py-6">
        <Link href="/" className="font-display text-2xl font-bold">
          <span aria-hidden>🌙</span> BedTimeStory
        </Link>
        <div className="flex gap-3">
          {session?.user ? (
            <Link href="/dashboard" className="btn-secondary">
              My stories
            </Link>
          ) : (
            <Link href="/sign-in" className="btn-secondary">
              Sign in
            </Link>
          )}
        </div>
      </nav>

      <section className="relative z-10 mx-auto max-w-4xl px-6 pt-12 pb-24 text-center">
        <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight">
          Turn today
          <br />
          <span className="bg-gradient-to-r from-peach via-lavender to-sky bg-clip-text text-transparent">
            into a bedtime story
          </span>
        </h1>
        <p className="mt-6 text-xl text-ink/70 max-w-2xl mx-auto">
          Sit with your child, share the funny, the kind, and the tricky parts of
          their day — and we&apos;ll weave it into a story they&apos;ll never forget,
          with pictures, music, and a warm voice to read it aloud.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
          {session?.user ? (
            <Link href="/new" className="btn text-xl py-5 px-10">
              ✨ Start tonight&apos;s story
            </Link>
          ) : (
            <>
              <form action={continueAsGuest}>
                <button type="submit" className="btn text-xl py-5 px-10">
                  ✨ Start tonight&apos;s story
                </button>
              </form>
              <Link
                href="/sign-in"
                className="text-ink/70 hover:text-ink underline underline-offset-4 font-display font-bold"
              >
                or sign in to save your stories
              </Link>
            </>
          )}
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-6 text-left">
          {[
            {
              emoji: "🌟",
              title: "Three little questions",
              body: "What was funny? What was kind? What felt hard? That's all we need.",
            },
            {
              emoji: "🎨",
              title: "A story that's yours",
              body: "AI weaves your child's day into a gentle adventure with their own pictures.",
            },
            {
              emoji: "🎧",
              title: "Watch or read together",
              body: "Auto-playing video with a friendly narrator, or a swipeable picture book.",
            },
          ].map((c) => (
            <div key={c.title} className="card">
              <div className="text-4xl mb-3">{c.emoji}</div>
              <h3 className="text-xl font-bold mb-1">{c.title}</h3>
              <p className="text-ink/70">{c.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
