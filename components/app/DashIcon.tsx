"use client";

import type { CSSProperties, ReactNode } from "react";

/**
 * Kumpulan ikon garis (stroke currentColor) pengganti emoji pada dashboard.
 * Ukuran mengikuti `size` (px) dan pewarisan warna teks induknya.
 */
export type DashIconName =
  | "book"
  | "printer"
  | "scale"
  | "receipt"
  | "camera"
  | "landmark"
  | "eye"
  | "info"
  | "check"
  | "close";

const GLYPHS: Record<DashIconName, ReactNode> = {
  book: (
    <path
      d="M10 5.4C8.6 4.4 6.8 3.9 4.4 3.9v11.3c2.4 0 4.2.5 5.6 1.4 1.4-.9 3.2-1.4 5.6-1.4V3.9c-2.4 0-4.2.5-5.6 1.5v11.2"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  printer: (
    <>
      <path
        d="M6.5 7.2V3.6h7v3.6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <rect
        x="3.4"
        y="7.2"
        width="13.2"
        height="5.8"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M6.5 11.4h7v5H6.5z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </>
  ),
  scale: (
    <path
      d="M10 3.6v12.8M5.2 16.4h9.6M3 7.6h14M6.4 7.6 3.9 12.6h5L6.4 7.6Zm7.2 0-2.5 5h5l-2.5-5Z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  receipt: (
    <>
      <path
        d="M5.2 3.4h9.6v13.2l-1.9-1.3-1.9 1.3-1.9-1.3-1.9 1.3-2-1.3V3.4Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M7.6 7.2h4.8M7.6 10.1h4.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </>
  ),
  camera: (
    <>
      <path
        d="M7.4 6.4 8.7 4.1h2.6l1.3 2.3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <rect
        x="3.4"
        y="6.4"
        width="13.2"
        height="8.9"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="10" cy="10.7" r="2.4" stroke="currentColor" strokeWidth="1.4" />
    </>
  ),
  landmark: (
    <path
      d="M2.8 8.2 10 3.7l7.2 4.5M4.6 9.2v5.4M8 9.2v5.4M12 9.2v5.4M15.4 9.2v5.4M2.8 16.4h14.4"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  eye: (
    <>
      <path
        d="M2.6 10S5.6 5.6 10 5.6 17.4 10 17.4 10 14.4 14.4 10 14.4 2.6 10 2.6 10Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2" stroke="currentColor" strokeWidth="1.4" />
    </>
  ),
  info: (
    <>
      <circle cx="10" cy="10" r="6.9" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 9.3v3.9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="10" cy="6.8" r="0.85" fill="currentColor" />
    </>
  ),
  check: (
    <path
      d="m4.4 10.4 3.6 3.6 7.6-8"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  close: (
    <path
      d="m6 6 8 8M14 6l-8 8"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  ),
};

export default function DashIcon({
  name,
  size = 14,
  className = "dsh__icoinline",
  style,
}: {
  name: DashIconName;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      className={className}
      style={style}
    >
      {GLYPHS[name]}
    </svg>
  );
}
