import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export default function SignupPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full">
        <AuthForm mode="signup" />
        <p className="mt-5 text-center text-sm text-slate-600">Already have an account? <Link className="font-semibold text-primary" href="/login">Sign in</Link></p>
      </div>
    </main>
  );
}
