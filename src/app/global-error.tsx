"use client";

// Catches failures in the root layout itself, where `error.tsx` cannot help —
// it must render its own <html>/<body> because the layout that normally
// provides them is the thing that failed. Deliberately dependency-free and
// inline-styled: if the layout blew up, the font variables and Tailwind
// theme it sets up may not be available either.

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en-GB">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "2rem",
          background: "#ffffff",
          color: "#3d4f61",
          fontFamily: "system-ui, -apple-system, sans-serif",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "32rem" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0 }}>
            Matchlisted is having a moment
          </h1>
          <p style={{ marginTop: "0.75rem", color: "#5f7080", lineHeight: 1.6 }}>
            Something failed before the page could load. Nothing you were
            working on has been lost.
          </p>
          {error.digest ? (
            <p
              style={{
                marginTop: "1rem",
                fontFamily: "ui-monospace, monospace",
                fontSize: "0.75rem",
                color: "#647482",
              }}
            >
              Reference: {error.digest}
            </p>
          ) : null}
          <button
            onClick={reset}
            style={{
              marginTop: "1.75rem",
              minHeight: "2.75rem",
              padding: "0.75rem 1.5rem",
              borderRadius: "9999px",
              border: "none",
              background: "#b94a1c",
              color: "#ffffff",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
