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

// Inter for the interface, Bricolage Grotesque for headlines, JetBrains Mono
// for keys and figures. Variable fonts, self-hosted so builds never need the
// network.
const sans = localFont({
  src: "./fonts/inter-latin-wght-normal.woff2",
  variable: "--font-inter",
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
  src: "./fonts/jetbrains-mono-latin-wght-normal.woff2",
  variable: "--font-jetbrains-mono",
  weight: "100 800",
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
      className={`h-full antialiased ${sans.variable} ${mono.variable} ${display.variable}`}
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
