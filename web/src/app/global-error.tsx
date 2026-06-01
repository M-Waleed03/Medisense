"use client";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <html lang="en">
      <body>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, fontFamily: "Inter, system-ui, sans-serif", background: "#171721", color: "#ededf3" }}>
          <div style={{ maxWidth: 460, border: "1px solid rgba(112,112,125,0.45)", padding: 24, background: "#1e1e2a" }}>
            <p style={{ color: "#c3c3cc", fontWeight: 480, fontSize: 12, letterSpacing: 1.6 }}>MEDISENSE</p>
            <h1 style={{ margin: "8px 0", fontSize: 28, fontWeight: 360 }}>Application error</h1>
            <p style={{ color: "#c3c3cc", lineHeight: 1.6 }}>{error.message || "Reload the app and try again."}</p>
          </div>
        </main>
      </body>
    </html>
  );
}
