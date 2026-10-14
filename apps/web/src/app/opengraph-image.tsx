import { readFile } from "node:fs/promises";
import path from "node:path";

import { ImageResponse } from "next/og";

import { brandColors } from "@zentro/ui/lib/theme-colors";

export const alt = "Zentro: projects, tasks and docs in one workspace";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const serif = await readFile(
    path.join(
      process.cwd(),
      "src/app/fonts/instrument-serif-latin-400-normal.woff",
    ),
  );

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        background: brandColors.paper,
        color: brandColors.ink,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <svg width="56" height="56" viewBox="0 0 32 32" fill="none">
          <path
            d="M7.5 8h17L7.5 24h17"
            stroke={brandColors.accent}
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="7.5" cy="8" r="3.1" fill={brandColors.accent} />
          <circle cx="24.5" cy="24" r="3.1" fill={brandColors.accent} />
        </svg>
        <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: -1 }}>
          Zentro
        </div>
      </div>
      <div
        style={{
          fontFamily: "Instrument Serif",
          fontSize: 112,
          lineHeight: 1.02,
          maxWidth: 940,
        }}
      >
        Projects, tasks and docs, all connected.
      </div>
    </div>,
    {
      ...size,
      fonts: [{ name: "Instrument Serif", data: serif, style: "normal" }],
    },
  );
}
