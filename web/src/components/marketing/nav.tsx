import Link from "next/link";
import { Activity, LogIn } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-white"><Activity className="h-5 w-5" /></span>
          MEDISENSE
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <Link href="/features">Features</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <Link href="/login" className={buttonStyles({ size: "sm" })}>
          <LogIn className="h-4 w-4" /> Sign in
        </Link>
      </div>
    </header>
  );
}
