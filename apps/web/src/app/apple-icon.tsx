import { ImageResponse } from "next/og";

import { brandColors } from "@zentro/ui/lib/theme-colors";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: brandColors.accent,
      }}
    >
      <svg width="112" height="112" viewBox="0 0 32 32" fill="none">
        <path
          d="M7.5 8h17L7.5 24h17"
          stroke={brandColors.onAccent}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="7.5" cy="8" r="3.1" fill={brandColors.onAccent} />
        <circle cx="24.5" cy="24" r="3.1" fill={brandColors.onAccent} />
      </svg>
    </div>,
    size,
  );
}
