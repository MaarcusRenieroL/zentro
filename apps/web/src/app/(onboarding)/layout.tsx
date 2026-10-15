import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Set up your workspace",
};

// Onboarding has its own frame (a top bar with the steps), so it sits outside
// the split auth layout.
export default function OnboardingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="flex min-h-screen flex-col bg-canvas">{children}</div>;
}
