import { Suspense } from "react";
import { AuthShell } from "../components/auth/AuthShell";
import { KycFlow } from "../components/auth/kyc/KycFlow";
import { RequireAuth } from "../lib/auth/guards";

export const metadata = { title: "KYC · BidNaija" };

export default function KycPage() {
  return (
    <AuthShell variant="verify">
      <RequireAuth>
        <Suspense fallback={null}>
          <KycFlow />
        </Suspense>
      </RequireAuth>
    </AuthShell>
  );
}
