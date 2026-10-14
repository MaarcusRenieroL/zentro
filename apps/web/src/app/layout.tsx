import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import localFont from "next/font/local";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
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

// Display serif: page titles, the dashboard briefing, empty states, docs and
// the landing page, at 24px and above. Self-hosted, so builds never need the
// network.
const display = localFont({
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
      className={`h-full antialiased ${GeistSans.variable} ${GeistMono.variable} ${display.variable}`}
    >
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
