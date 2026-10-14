import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import localFont from "next/font/local";
import { JSX } from "react";

import { Toaster } from "@zentro/ui/shadcn/sonner";
import {
  densityCookie,
  parseDensity,
  themeColors,
} from "@zentro/ui/lib/theme-colors";

import "./globals.css";
import { ThemeProvider } from "../components/providers/theme-provider";
import { AppTRPCProvider } from "../components/providers/trpc-provider";

// Geist for the interface, Bricolage Grotesque for display type, Geist Mono for
// keys, timers and figures, Instrument Serif for the editorial accent.
// Variable fonts, self-hosted so builds never need the network.
const sans = localFont({
  src: "./fonts/geist-latin-wght-normal.woff2",
  variable: "--font-geist",
  weight: "100 900",
  display: "swap",
});
const display = localFont({
  src: "./fonts/bricolage-grotesque-latin-wght-normal.woff2",
  variable: "--font-bricolage",
  weight: "200 800",
  display: "swap",
});
const mono = localFont({
  src: "./fonts/geist-mono-latin-wght-normal.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});
const serif = localFont({
  src: [
    {
      path: "./fonts/instrument-serif-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/instrument-serif-latin-400-italic.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Zentro",
    template: "%s · Zentro",
  },
  description:
    "Projects, tasks and docs in one workspace, with roles and an audit log that go all the way down.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: themeColors.light },
    { media: "(prefers-color-scheme: dark)", color: themeColors.dark },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<JSX.Element> {
  const density = parseDensity((await cookies()).get(densityCookie)?.value);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-density={density}
      className={`h-full antialiased ${sans.variable} ${mono.variable} ${display.variable} ${serif.variable}`}
    >
      <head>
        {/* Marks the page as scripted before first paint, so reveal effects
            only hide content when they are guaranteed to show it again. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('js')",
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppTRPCProvider>{children}</AppTRPCProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
