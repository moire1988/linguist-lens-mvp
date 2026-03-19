/**
 * SVG + CSS mesh-gradient background (Stripe / Vercel style).
 * feGaussianBlur on a shared <g> blends overlapping shapes into a true
 * mesh-gradient effect. Four circles animate independently via CSS keyframes.
 */
export function MeshBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1440 900"
      >
        <defs>
          <filter id="mesh-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="85" />
          </filter>
        </defs>

        {/* All blobs share one blur filter → colors merge at overlap = mesh gradient */}
        <g filter="url(#mesh-blur)">
          <g className="animate-mesh-1">
            <circle cx="180" cy="160" r="340" fill="rgba(129,140,248,0.38)" />
          </g>
          <g className="animate-mesh-2">
            <circle cx="1240" cy="190" r="285" fill="rgba(167,139,250,0.32)" />
          </g>
          <g className="animate-mesh-3">
            <circle cx="710" cy="760" r="315" fill="rgba(125,211,252,0.28)" />
          </g>
          <g className="animate-mesh-4">
            <circle cx="1110" cy="660" r="245" fill="rgba(196,181,253,0.26)" />
          </g>
        </g>
      </svg>

      {/* Subtle dot grid overlay */}
      <div className="absolute inset-0 bg-dot-grid" />
    </div>
  );
}
