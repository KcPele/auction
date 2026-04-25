import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface SessionUser {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: string;
  nin: string | null;
  isActive: boolean;
}

interface UseSessionReturn {
  user: SessionUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

async function fetchSession(): Promise<SessionUser | null> {
  try {
    const sessionRes = await fetch(`${API_BASE}/auth/get-session`, {
      credentials: "include",
    });
    if (!sessionRes.ok) return null;

    const userRes = await fetch(`${API_BASE}/users/me`, {
      credentials: "include",
    });
    if (userRes.ok) return userRes.json();
    return null;
  } catch {
    return null;
  }
}

export function useSession(): UseSessionReturn {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const userData = await fetchSession();
    setUser(userData);
    setIsLoading(false);
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE}/auth/sign-out`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // ignore
    }
    setUser(null);
    router.push("/login");
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    fetchSession().then((userData) => {
      if (!cancelled) {
        setUser(userData);
        setIsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    refresh,
    logout,
  };
}
