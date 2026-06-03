"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Activity, Bot, ClipboardList, FileScan, History, LayoutDashboard, LogOut, Settings, Shield, Stethoscope, User } from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ensureClientProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AiAvatar, NeuralField } from "@/components/ui/premium";
import { ThemeToggle } from "@/components/theme/theme-toggle";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/symptom-checker", label: "Symptoms", icon: ClipboardList },
  { href: "/doctors", label: "Doctors", icon: Stethoscope },
  { href: "/report-analysis", label: "Reports", icon: FileScan },
  { href: "/chatbot", label: "Chatbot", icon: Bot },
  { href: "/history", label: "History", icon: History },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/admin", label: "Admin", icon: Shield }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!auth) {
      location.href = "/login";
      return;
    }
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        location.href = `/login?redirectedFrom=${encodeURIComponent(pathname)}`;
        return;
      }
      await ensureClientProfile();
      setReady(true);
    });
  }, [pathname]);

  async function logout() {
    if (auth) await signOut(auth);
    location.href = "/login";
  }

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-deep-space">
        <div className="glass holo-border rounded-none p-6 text-center">
          <AiAvatar size="lg" />
          <p className="mt-4 text-sm font-medium uppercase tracking-[0.16em] text-silver">Loading MEDISENSE</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-transparent">
      <NeuralField className="fixed opacity-20" />
      <div className="fixed right-4 top-4 z-50 lg:right-6 lg:top-6">
        <ThemeToggle />
      </div>
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 border-r border-lead/25 bg-deep-space/86 p-5 backdrop-blur-2xl lg:block">
        <Link href="/dashboard" className="mb-8 flex items-center gap-3 text-lg font-medium tracking-[0.08em] text-starlight">
          <span className="grid h-10 w-10 place-items-center rounded-[4px] border border-primary/30 bg-graphite text-starlight"><Activity className="h-5 w-5" /></span>
          MEDISENSE
        </Link>
        <div className="mb-5 border border-lead/30 bg-midnight-slate/70 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-silver">AI care cockpit</p>
          <p className="mt-2 text-sm text-silver">Realtime symptoms, reports, and chat context.</p>
        </div>
        <nav className="space-y-1.5">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={cn("group flex items-center gap-3 rounded-pill px-4 py-2.5 text-sm font-medium text-silver transition duration-300 hover:bg-ghost-blue/10 hover:text-starlight", pathname === item.href && "bg-ghost-blue/12 text-starlight")}>
              <item.icon className="h-4 w-4" />
              {item.label}
              {pathname === item.href && <span className="ml-auto h-2 w-2 rounded-full bg-primary" />}
            </Link>
          ))}
        </nav>
        <Button variant="outline" className="absolute bottom-4 left-4 right-4 w-[calc(100%-2rem)]" onClick={logout}><LogOut className="h-4 w-4" /> Logout</Button>
      </aside>
      <main className="relative pb-24 lg:ml-72 lg:pb-0">
        <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-8 md:py-10">{children}</div>
      </main>
      <nav className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-5 border-t border-lead/30 bg-deep-space/92 px-2 py-2 backdrop-blur-2xl lg:hidden">
        {nav.slice(0, 5).map((item) => (
          <Link key={item.href} href={item.href} className={cn("grid place-items-center gap-1 rounded-pill py-2 text-[11px] font-medium text-silver", pathname === item.href && "bg-ghost-blue/12 text-starlight")}>
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <Link href="/chatbot" className="fixed bottom-24 right-4 z-50 grid h-12 w-12 place-items-center rounded-pill bg-primary text-pure-white lg:bottom-6">
        <Bot className="h-5 w-5" />
      </Link>
    </div>
  );
}
