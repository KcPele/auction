import { Suspense } from "react";
import { BrowseScreen } from "@/app/components/user-dashboard/screens/BrowseScreen";

export default function BrowsePage() {
  return (
    <Suspense fallback={null}>
      <BrowseScreen />
    </Suspense>
  );
}
