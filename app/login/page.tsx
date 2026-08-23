import { PageHeader } from "@/components/ui/PageHeader";
import LoginForm from "@/components/auth/LoginForm";
import { BrandMark } from "@/components/layout/BrandMark";

export default function LoginPage() {
  return (
    <>
      <PageHeader title="Login" />

      <div className="p-4 md:p-8">
        <div className="mb-6">
          <BrandMark />
        </div>
        <p className="mb-4 text-sm text-ink/70">Entre com seu email e senha.</p>
        <LoginForm />
      </div>
    </>
  );
}
