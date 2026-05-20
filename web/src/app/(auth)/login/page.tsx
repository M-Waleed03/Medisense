import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full">
        <AuthForm mode="login" />
        <p className="mt-5 text-center text-sm text-slate-600">New here? <Link className="font-semibold text-primary" href="/signup">Create an account</Link></p>
      </div>
    </main>
  );
}
