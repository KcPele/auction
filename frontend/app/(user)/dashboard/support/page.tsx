import { Suspense } from "react";
import { SupportChatScreen } from "@/app/components/support/SupportChatScreen";

export const dynamic = "force-dynamic";

export default function SupportPage() {
  return (
    <Suspense fallback={null}>
      <SupportChatScreen />
    </Suspense>
  );
}
