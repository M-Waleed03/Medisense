"use client";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <html lang="en">
      <body>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, fontFamily: "Arial, sans-serif" }}>
          <div style={{ maxWidth: 460, border: "1px solid #fee2e2", borderRadius: 8, padding: 24 }}>
            <p style={{ color: "#dc2626", fontWeight: 700, fontSize: 12, letterSpacing: 1.6 }}>MEDISENSE</p>
            <h1 style={{ margin: "8px 0", fontSize: 28 }}>Application error</h1>
            <p style={{ color: "#475569", lineHeight: 1.6 }}>{error.message || "Reload the app and try again."}</p>
          </div>
        </main>
      </body>
    </html>
  );
}
