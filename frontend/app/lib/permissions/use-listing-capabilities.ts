"use client";

import { useMemo } from "react";
import { useMe } from "@/app/components/auth/hooks/use-me";
import { deriveListingCapabilities } from "./listing-capabilities";

export function useListingCapabilities() {
  const me = useMe();
  const capabilities = useMemo(
    () => deriveListingCapabilities(me.data?.listingPermissions),
    [me.data?.listingPermissions],
  );

  return {
    ...capabilities,
    isLoading: me.isLoading,
  };
}
