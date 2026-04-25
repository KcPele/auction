import { Suspense } from "react";
import { AuthShell } from "../components/auth/AuthShell";
import { KycFlow } from "../components/auth/kyc/KycFlow";

export const metadata = { title: "KYC · BidNaija" };

export default function KycPage() {
  return (
    <AuthShell variant="verify">
      <Suspense fallback={null}>
        <KycFlow />
      </Suspense>
    </AuthShell>
  );
}
