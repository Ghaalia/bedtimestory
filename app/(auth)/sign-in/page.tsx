import { signIn } from "@/lib/auth";
import Link from "next/link";
import { Sparkles } from "@/components/animations/Sparkles";
import { continueAsGuest } from "@/app/actions/guest";

export default function SignInPage() {
  return (
    <main className="relative min-h-screen flex items-center justify-center p-6">
      <Sparkles />
      <div className="card w-full max-w-md relative z-10">
        <Link href="/" className="font-display text-xl font-bold inline-block mb-6">
          <span aria-hidden>🌙</span> BedTimeStory
        </Link>
        <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
        <p className="text-ink/70 mb-8">
          Sign in to start tonight&apos;s story.
        </p>

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
        >
          <button type="submit" className="btn w-full text-lg">
            Continue with Google
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-ink/40">
          <hr className="flex-1 border-ink/10" />
          <span className="text-sm">or</span>
          <hr className="flex-1 border-ink/10" />
        </div>

        <form
          action={async (formData: FormData) => {
            "use server";
            await signIn("resend", {
              email: formData.get("email") as string,
              redirectTo: "/dashboard",
            });
          }}
          className="space-y-3"
        >
          <input
            type="email"
            name="email"
            required
            placeholder="parent@example.com"
            className="input"
          />
          <button type="submit" className="btn-secondary w-full text-lg">
            Email me a magic link
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-ink/40">
          <hr className="flex-1 border-ink/10" />
          <span className="text-sm">or</span>
          <hr className="flex-1 border-ink/10" />
        </div>

        <form action={continueAsGuest}>
          <button
            type="submit"
            className="w-full text-ink/70 hover:text-ink underline underline-offset-4 font-display font-bold"
          >
            Continue as a guest →
          </button>
          <p className="text-center text-xs text-ink/50 mt-2">
            No sign-up needed. Your stories stay on this device for 30 days.
          </p>
        </form>
      </div>
    </main>
  );
}
