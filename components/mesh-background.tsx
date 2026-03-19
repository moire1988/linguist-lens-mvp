/**
 * Animated mesh-gradient background.
 *
 * Technique:
 *   1. Draw large, overlapping colour ellipses
 *   2. feGaussianBlur  → blends colours into a soft mesh gradient
 *   3. feTurbulence    → generates organic fractal noise (SMIL-animated)
 *   4. feDisplacementMap → uses the noise to ripple/distort the blurred colours
 *
 * The feTurbulence baseFrequency is animated with SMIL <animate> which runs
 * entirely on the GPU — zero JS, zero CPU overhead.
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
          <filter id="wave-mesh" x="-40%" y="-40%" width="180%" height="180%">
            {/* ① Blur: melts the ellipses into a smooth mesh gradient */}
            <feGaussianBlur in="SourceGraphic" stdDeviation="72" result="blurred" />

            {/* ② Noise: fractalNoise whose frequency shifts slowly over time */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.007 0.005"
              numOctaves="3"
              seed="8"
              result="noise"
            >
              <animate
                attributeName="baseFrequency"
                values="0.006 0.004;0.011 0.008;0.014 0.010;0.010 0.007;0.006 0.004"
                keyTimes="0;0.25;0.5;0.75;1"
                calcMode="spline"
                keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1"
                dur="14s"
                repeatCount="indefinite"
              />
            </feTurbulence>

            {/* ③ Displacement: noise distorts the blurred colours → water-ripple */}
            <feDisplacementMap
              in="blurred"
              in2="noise"
              scale="95"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>

        {/* Colour blobs — large enough that displacement never exposes bare edges */}
        <g filter="url(#wave-mesh)">
          <ellipse cx="160"  cy="150"  rx="420" ry="360" fill="rgba(129,140,248,0.48)" />
          <ellipse cx="1270" cy="195"  rx="360" ry="300" fill="rgba(167,139,250,0.42)" />
          <ellipse cx="680"  cy="790"  rx="400" ry="330" fill="rgba(125,211,252,0.38)" />
          <ellipse cx="1130" cy="690"  rx="290" ry="250" fill="rgba(196,181,253,0.34)" />
          {/* Centre fill to prevent a pale gap in the middle */}
          <ellipse cx="720"  cy="450"  rx="320" ry="270" fill="rgba(165,180,252,0.20)" />
        </g>
      </svg>

      {/* Subtle dot grid overlay */}
      <div className="absolute inset-0 bg-dot-grid" />
    </div>
  );
}
