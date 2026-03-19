/**
 * Animated mesh-gradient background — two-layer approach:
 *
 *  Layer 1 (large-scale movement):
 *    SVG SMIL <animate> shifts cx/cy of each ellipse by 90-120 px over 9-13 s.
 *    Even through heavy blur, this creates clearly visible shifting colour zones.
 *
 *  Layer 2 (water-ripple texture):
 *    feTurbulence baseFrequency is SMIL-animated (6 s) so the fractal noise
 *    pattern shifts continuously. feDisplacementMap uses that noise to warp
 *    the already-blurred blobs → organic water-ripple edges.
 *
 *  Everything runs on the GPU via SVG filters + SMIL; zero JS overhead.
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
          <filter id="blur-ripple" x="-35%" y="-35%" width="170%" height="170%">
            {/* ① Gaussian blur: fuse overlapping ellipses into a mesh gradient */}
            <feGaussianBlur in="SourceGraphic" stdDeviation="58" result="blurred" />

            {/* ② Animated fractal noise (6 s cycle) */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.008"
              numOctaves="3"
              seed="5"
              result="noise"
            >
              <animate
                attributeName="baseFrequency"
                values="0.010 0.007;0.020 0.014;0.024 0.016;0.016 0.011;0.010 0.007"
                keyTimes="0;0.25;0.5;0.75;1"
                calcMode="spline"
                keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1"
                dur="6s"
                repeatCount="indefinite"
              />
            </feTurbulence>

            {/* ③ Displace blurred blobs with noise → water-ripple edges */}
            <feDisplacementMap
              in="blurred"
              in2="noise"
              scale="48"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>

        <g filter="url(#blur-ripple)">

          {/* Blob 1 – indigo, top-left  (cx moves ±95 px, cy ±70 px, 10 s) */}
          <ellipse cx="160" cy="155" rx="420" ry="355" fill="rgba(99,102,241,0.54)">
            <animate attributeName="cx"
              values="160;258;102;212;160"
              keyTimes="0;0.25;0.5;0.75;1" calcMode="spline"
              keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1"
              dur="10s" repeatCount="indefinite" />
            <animate attributeName="cy"
              values="155;82;238;168;155"
              keyTimes="0;0.25;0.5;0.75;1" calcMode="spline"
              keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1"
              dur="10s" repeatCount="indefinite" />
          </ellipse>

          {/* Blob 2 – violet, top-right  (cx moves ±105 px, cy ±88 px, 13 s) */}
          <ellipse cx="1265" cy="190" rx="355" ry="298" fill="rgba(139,92,246,0.48)">
            <animate attributeName="cx"
              values="1265;1160;1325;1192;1265"
              keyTimes="0;0.25;0.5;0.75;1" calcMode="spline"
              keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1"
              dur="13s" repeatCount="indefinite" />
            <animate attributeName="cy"
              values="190;278;118;248;190"
              keyTimes="0;0.25;0.5;0.75;1" calcMode="spline"
              keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1"
              dur="13s" repeatCount="indefinite" />
          </ellipse>

          {/* Blob 3 – sky, bottom-center  (cx moves ±102 px, cy ±82 px, 11 s) */}
          <ellipse cx="680" cy="798" rx="398" ry="328" fill="rgba(96,165,250,0.44)">
            <animate attributeName="cx"
              values="680;782;598;744;680"
              keyTimes="0;0.25;0.5;0.75;1" calcMode="spline"
              keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1"
              dur="11s" repeatCount="indefinite" />
            <animate attributeName="cy"
              values="798;716;858;752;798"
              keyTimes="0;0.25;0.5;0.75;1" calcMode="spline"
              keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1"
              dur="11s" repeatCount="indefinite" />
          </ellipse>

          {/* Blob 4 – lavender, bottom-right  (cx ±92 px, cy ±80 px, 9 s) */}
          <ellipse cx="1132" cy="688" rx="288" ry="248" fill="rgba(167,139,250,0.40)">
            <animate attributeName="cx"
              values="1132;1040;1215;1088;1132"
              keyTimes="0;0.25;0.5;0.75;1" calcMode="spline"
              keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1"
              dur="9s" repeatCount="indefinite" />
            <animate attributeName="cy"
              values="688;768;612;722;688"
              keyTimes="0;0.25;0.5;0.75;1" calcMode="spline"
              keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1"
              dur="9s" repeatCount="indefinite" />
          </ellipse>

        </g>
      </svg>

      {/* Subtle dot grid overlay */}
      <div className="absolute inset-0 bg-dot-grid" />
    </div>
  );
}
