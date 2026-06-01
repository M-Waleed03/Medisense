import Link from "next/link";
import { Activity, LogIn } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-lead/24 bg-deep-space/72 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3 font-medium tracking-[0.08em] text-starlight">
          <span className="grid h-9 w-9 place-items-center rounded-[4px] border border-primary/30 bg-graphite text-starlight"><Activity className="h-5 w-5" /></span>
          MEDISENSE
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-starlight md:flex">
          <Link href="/features">Features</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className={buttonStyles({ variant: "secondary", size: "sm", className: "px-4 sm:px-5" })}>
            <LogIn className="h-4 w-4" /> <span className="hidden sm:inline">Sign in</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
