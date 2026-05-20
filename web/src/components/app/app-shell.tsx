"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Activity, Bot, ClipboardList, FileScan, History, LayoutDashboard, LogOut, Settings, Shield, User } from "lucide-react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ensureClientProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/symptom-checker", label: "Symptoms", icon: ClipboardList },
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

  if (!ready) return <div className="grid min-h-screen place-items-center text-sm font-semibold text-slate-600">Loading MEDISENSE...</div>;

  return (
    <div className="min-h-screen bg-transparent">
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-72 border-r border-white/70 bg-white/78 p-4 backdrop-blur-xl lg:block">
        <Link href="/dashboard" className="mb-8 flex items-center gap-2 text-lg font-black">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-white"><Activity className="h-5 w-5" /></span>
          MEDISENSE
        </Link>
        <nav className="space-y-1">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100", pathname === item.href && "bg-blue-50 text-primary")}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <Button variant="outline" className="absolute bottom-4 left-4 right-4 w-[calc(100%-2rem)]" onClick={logout}><LogOut className="h-4 w-4" /> Logout</Button>
      </aside>
      <main className="pb-24 lg:ml-72 lg:pb-0">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">{children}</div>
      </main>
      <nav className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-5 border-t border-white/80 bg-white/90 px-2 py-2 backdrop-blur-xl lg:hidden">
        {nav.slice(0, 5).map((item) => (
          <Link key={item.href} href={item.href} className={cn("grid place-items-center gap-1 rounded-lg py-2 text-[11px] font-semibold text-slate-500", pathname === item.href && "bg-blue-50 text-primary")}>
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <Link href="/chatbot" className="fixed bottom-24 right-4 z-50 grid h-12 w-12 place-items-center rounded-lg bg-accent text-white shadow-glow lg:bottom-6">
        <Bot className="h-5 w-5" />
      </Link>
    </div>
  );
}
