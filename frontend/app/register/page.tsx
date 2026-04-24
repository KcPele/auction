import { AuthShell } from "../components/auth/AuthShell";
import { RegisterForm } from "../components/auth/RegisterForm";

export const metadata = { title: "Register · BidNaija" };

export default function RegisterPage() {
  return (
    <AuthShell variant="register">
      <RegisterForm />
    </AuthShell>
  );
}
