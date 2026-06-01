"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-deep-space px-4">
      <div className="max-w-md border border-lead/35 bg-midnight-slate p-6">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-silver">MEDISENSE</p>
        <h1 className="mt-2 font-arcadiaDisplay text-heading-sm font-light text-starlight">Something needs a refresh</h1>
        <p className="mt-3 text-sm leading-6 text-silver">{error.message || "The page hit an unexpected error while loading."}</p>
        <Button className="mt-5" onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}
