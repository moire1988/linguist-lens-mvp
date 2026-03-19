/**
 * Animated mesh-gradient background.
 *
 * How it works:
 *   - Four large circular divs are placed at the screen corners/edges.
 *   - Each div translates 200–280 px independently via CSS @keyframes (no scale).
 *   - A single `filter: blur(110px)` on the PARENT div blurs all four at once,
 *     so wherever their colours overlap they blend into a smooth mesh gradient.
 *   - Applying blur to the PARENT (not each child) is the key — it merges colours
 *     the way SVG feGaussianBlur on a <g> was meant to, but without the
 *     bounding-box rescaling artefact that caused the "zoom from top-left" look.
 */
export function MeshBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">

      {/* Blob layer — parent blur merges overlapping colours into mesh gradient */}
      <div
        className="absolute inset-0"
        style={{ filter: "blur(110px)", willChange: "filter" }}
      >
        {/* Blob 1 – indigo, anchored top-left */}
        <div
          className="drift-1 absolute rounded-full"
          style={{
            width: 700, height: 700,
            top: -260, left: -260,
            background: "rgba(99, 102, 241, 0.42)",
          }}
        />
        {/* Blob 2 – violet, anchored top-right */}
        <div
          className="drift-2 absolute rounded-full"
          style={{
            width: 620, height: 620,
            top: -200, right: -220,
            background: "rgba(139, 92, 246, 0.37)",
          }}
        />
        {/* Blob 3 – sky blue, anchored bottom-center */}
        <div
          className="drift-3 absolute rounded-full"
          style={{
            width: 660, height: 660,
            bottom: -270, left: "calc(50% - 330px)",
            background: "rgba(96, 165, 250, 0.34)",
          }}
        />
        {/* Blob 4 – lavender, anchored bottom-right */}
        <div
          className="drift-4 absolute rounded-full"
          style={{
            width: 520, height: 520,
            bottom: -180, right: -160,
            background: "rgba(196, 181, 253, 0.36)",
          }}
        />
      </div>

      {/* Dot grid overlay */}
      <div className="absolute inset-0 bg-dot-grid" />
    </div>
  );
}
