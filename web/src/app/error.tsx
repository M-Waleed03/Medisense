"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="max-w-md rounded-lg border border-red-100 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-red-600">MEDISENSE</p>
        <h1 className="mt-2 text-2xl font-black text-slate-950">Something needs a refresh</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{error.message || "The page hit an unexpected error while loading."}</p>
        <Button className="mt-5" onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}
