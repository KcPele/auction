import { Suspense } from "react";
import { AuthShell } from "../components/auth/AuthShell";
import { ResetPasswordForm } from "../components/auth/ResetPasswordForm";

export const metadata = { title: "Reset password · BidNaija" };

export default function ResetPasswordPage() {
  return (
    <AuthShell variant="bid">
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
