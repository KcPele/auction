"use client";
// Kept as a re-export so legacy imports continue to work.
// Real implementation lives in `app/lib/auth/guards.tsx`.
export { RequireAuth as SessionGuard } from "@/app/lib/auth/guards";
