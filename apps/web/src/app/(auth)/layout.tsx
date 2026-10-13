import type { Metadata } from "next";

import { AuthFooter } from "~/src/features/auth/components/layout/auth-footer";
import { AuthNavbar } from "~/src/features/auth/components/layout/auth-navbar";

export const metadata: Metadata = {
  title: "Account | Zentro",
  description: "Sign in or create your Zentro account.",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AuthNavbar />
      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        {children}
      </main>
      <AuthFooter />
    </div>
  );
}
