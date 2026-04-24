import { AuthShell } from "../components/auth/AuthShell";
import { LoginForm } from "../components/auth/LoginForm";

export const metadata = { title: "Sign in · BidNaija" };

export default function LoginPage() {
  return (
    <AuthShell variant="bid">
      <LoginForm />
    </AuthShell>
  );
}
