"use client";

import { useState } from "react";

export function LinguistLensLogo({
  size = 24,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const [scanKey, setScanKey] = useState(0);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="LinguistLens"
      className={className}
      onMouseEnter={() => setScanKey((k) => k + 1)}
      style={{ cursor: "pointer", overflow: "hidden" }}
    >
      <defs>
        {/* Upper-left half: horizontal violet→cyan */}
        <linearGradient id="ll-g1" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%"   stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>

        {/* Lower-right half: vertical violet→cyan */}
        <linearGradient id="ll-g2" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%"   stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>

        {/* Glint stripe: soft white feather (horizontal in element bbox) */}
        <linearGradient id="ll-g3" gradientUnits="objectBoundingBox"
          x1="0" y1="0.5" x2="1" y2="0.5">
          <stop offset="0%"   stopColor="white" stopOpacity="0"    />
          <stop offset="50%"  stopColor="white" stopOpacity="0.58" />
          <stop offset="100%" stopColor="white" stopOpacity="0"    />
        </linearGradient>

        {/* Circle clip */}
        <clipPath id="ll-circ">
          <circle cx="50" cy="50" r="50" />
        </clipPath>

        {/* Upper-left triangle */}
        <clipPath id="ll-upper">
          <polygon points="0,0 100,0 0,100" />
        </clipPath>

        {/* Lower-right triangle */}
        <clipPath id="ll-lower">
          <polygon points="100,0 100,100 0,100" />
        </clipPath>
      </defs>

      <g clipPath="url(#ll-circ)">
        {/* Upper-left half */}
        <rect width="100" height="100" fill="url(#ll-g1)" clipPath="url(#ll-upper)" />
        {/* Lower-right half */}
        <rect width="100" height="100" fill="url(#ll-g2)" clipPath="url(#ll-lower)" />

        {/*
          Scan glint — narrow rect centered at (50,50), height spans circle.
          CSS rotates it −45° and translateX sweeps it across the diagonal.
          Re-keyed on each hover to restart animation.
        */}
        {scanKey > 0 && (
          <rect
            key={scanKey}
            x="45" y="-60"
            width="10" height="220"
            fill="url(#ll-g3)"
            className="ll-scan-rect"
          />
        )}
      </g>
    </svg>
  );
}
