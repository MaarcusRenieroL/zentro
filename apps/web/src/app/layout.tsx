import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "../components/providers/theme-provider";
import { JSX } from "react";
import { AppTRPCProvider } from "../components/providers/trpc-provider";

export const metadata: Metadata = {
  title: "Zentro — The Operating System for Your Company",
  description:
    "Replace your disconnected tools with one unified platform. Tasks, docs, collaboration, and more — all in one place.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppTRPCProvider>{children}</AppTRPCProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
