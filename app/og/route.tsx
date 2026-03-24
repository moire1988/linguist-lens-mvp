import { ImageResponse } from "next/og";

export const runtime = "edge";

const CHIPS = ["Phrasal Verbs", "Idioms", "Collocations", "CEFR-Matched"];

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "80px",
          background: "linear-gradient(135deg, #1e1b4b 0%, #3730a3 50%, #4f46e5 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative glow circles */}
        <div
          style={{
            position: "absolute",
            top: -130,
            right: -130,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "rgba(99,102,241,0.28)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            right: 180,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "rgba(167,139,250,0.2)",
            display: "flex",
          }}
        />

        {/* AI badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "rgba(165,180,252,0.15)",
            border: "1px solid rgba(165,180,252,0.35)",
            borderRadius: 100,
            padding: "8px 24px",
            marginBottom: 36,
          }}
        >
          <span style={{ color: "#a5b4fc", fontSize: 22, fontWeight: 600 }}>
            AI-Powered English Learning
          </span>
        </div>

        {/* Brand name with logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 28, marginBottom: 18 }}>
          {/* Logo circle (gradient approximation for ImageResponse) */}
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, #7C3AED 0%, #6366F1 55%, #06B6D4 100%)",
              display: "flex",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 84,
              fontWeight: 800,
              color: "white",
              letterSpacing: "-2px",
              lineHeight: 1,
            }}
          >
            LinguistLens
          </span>
        </div>

        {/* Tagline */}
        <div style={{ display: "flex", marginBottom: 56 }}>
          <span style={{ fontSize: 34, color: "#c7d2fe", lineHeight: 1.4 }}>
            Discover the phrases that make you fluent
          </span>
        </div>

        {/* Feature chips */}
        <div style={{ display: "flex", gap: 14 }}>
          {CHIPS.map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.22)",
                borderRadius: 10,
                padding: "10px 22px",
                color: "white",
                fontSize: 22,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
