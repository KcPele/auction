"use client";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useMe } from "@/app/components/auth/hooks/use-me";
import { buildAbilityFor, type AppAbility } from "./ability";

const AbilityContext = createContext<AppAbility | null>(null);

export function AbilityProvider({ children }: { children: ReactNode }) {
  const { data } = useMe();
  const ability = useMemo(
    () => buildAbilityFor(data?.role),
    [data?.role],
  );
  return (
    <AbilityContext.Provider value={ability}>{children}</AbilityContext.Provider>
  );
}

export function useAbility(): AppAbility {
  const ability = useContext(AbilityContext);
  if (!ability) {
    throw new Error("useAbility must be used inside <AbilityProvider>");
  }
  return ability;
}
