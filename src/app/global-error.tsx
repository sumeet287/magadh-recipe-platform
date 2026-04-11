"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            background: "linear-gradient(180deg, #0d0603 0%, #1a0c06 50%, #120804 100%)",
            fontFamily: "Georgia, serif",
          }}
        >
          <div style={{ textAlign: "center", maxWidth: "480px" }}>
            <p
              style={{
                fontSize: "6rem",
                fontWeight: "bold",
                lineHeight: 1,
                marginBottom: "16px",
                color: "rgba(212,132,58,0.12)",
              }}
            >
              500
            </p>
            <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#fff", marginBottom: "12px" }}>
              Something Went Wrong
            </h1>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px", lineHeight: 1.6, marginBottom: "32px" }}>
              We hit an unexpected error. Our team has been notified. Please try again.
            </p>
            <button
              onClick={() => reset()}
              style={{
                padding: "12px 32px",
                borderRadius: "999px",
                background: "linear-gradient(135deg, #D4843A 0%, #c67530 100%)",
                color: "#fff",
                border: "none",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(212,132,58,0.3)",
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
