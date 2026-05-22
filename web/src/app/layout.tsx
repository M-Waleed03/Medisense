import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "MEDISENSE | AI Healthcare Assistant",
  description: "AI-powered healthcare assistant for symptom analysis, medical report interpretation, and smart health guidance."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="cinematic-bg" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
