import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isGuest: true, name: true, email: true },
  });
  const isGuest = user?.isGuest ?? false;

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-6 md:px-10 py-5">
        <Link href="/dashboard" className="font-display text-2xl font-bold">
          <span aria-hidden>🌙</span> BedTimeStory
        </Link>
        <div className="flex items-center gap-3">
          {isGuest ? (
            <Link
              href="/sign-in"
              className="hidden sm:inline-flex text-sm font-display font-bold text-ink/70 hover:text-ink underline underline-offset-4"
            >
              Sign up to keep your stories
            </Link>
          ) : (
            <span className="hidden sm:inline text-ink/60">
              {user?.name || user?.email}
            </span>
          )}
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button className="btn-secondary text-sm py-2 px-4">
              {isGuest ? "Exit" : "Sign out"}
            </button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
