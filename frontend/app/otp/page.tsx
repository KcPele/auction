import { Suspense } from "react";
import { AuthShell } from "../components/auth/AuthShell";
import { OtpForm } from "../components/auth/OtpForm";

export const metadata = { title: "Verify · BidNaija" };

export default function OtpPage() {
  return (
    <AuthShell variant="register">
      <Suspense fallback={null}>
        <OtpForm />
      </Suspense>
    </AuthShell>
  );
}
