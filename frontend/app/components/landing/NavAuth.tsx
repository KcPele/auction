"use client";
import { useSession } from "@/app/lib/auth/client";
import { Button } from "./primitives/Button";

/**
 * Auth-aware half of the landing nav. Kept as its own client component so the
 * rest of the header stays server-rendered.
 */
export function NavAuth() {
  const { data: session, isPending } = useSession();

  // Hold the space while the session resolves, so the buttons don't flicker
  // from signed-out to signed-in on every landing page view.
  if (isPending) {
    return <div className="min-h-10 w-[150px]" aria-hidden />;
  }

  if (session?.user) {
    return <Button href="/dashboard">Go to dashboard</Button>;
  }

  return (
    <>
      <div className="hidden sm:block">
        <Button href="/login" variant="ghost">
          Log in
        </Button>
      </div>
      <Button href="/register">Create account</Button>
    </>
  );
}
