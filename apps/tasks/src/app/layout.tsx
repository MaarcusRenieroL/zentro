import type { Metadata, Viewport } from "next";
import { JSX } from "react";

import { Toaster } from "@zentro/ui/shadcn/sonner";

import { AppTRPCProvider } from "../components/providers/trpc-provider";
import { ThemeProvider } from "../components/providers/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zentro Tasks",
  description: "Plan, assign, and track startup work in one Zentro workspace.",
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
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
