import { AuthShell } from "../components/auth/AuthShell";
import { SuccessView } from "../components/auth/SuccessView";

export const metadata = { title: "Verified · BidNaija" };

export default function VerifiedPage() {
  return (
    <AuthShell variant="verify">
      <SuccessView />
    </AuthShell>
  );
}
