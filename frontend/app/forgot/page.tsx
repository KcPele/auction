import { AuthShell } from "../components/auth/AuthShell";
import { ForgotForm } from "../components/auth/ForgotForm";

export const metadata = { title: "Forgot password · BidNaija" };

export default function ForgotPage() {
  return (
    <AuthShell variant="bid">
      <ForgotForm />
    </AuthShell>
  );
}
