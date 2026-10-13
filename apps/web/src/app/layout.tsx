import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "../components/providers/theme-provider";
import { JSX } from "react";
import { AppTRPCProvider } from "../components/providers/trpc-provider";
import { Toaster } from "@zentro/ui/shadcn/sonner";

export const metadata: Metadata = {
  title: "Zentro — The Operating System for Your Company",
  description:
    "Replace your disconnected tools with one unified platform. Tasks, docs, collaboration, and more — all in one place.",
  generator: "v0.app",
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
