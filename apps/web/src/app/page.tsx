import { JSX } from "react";
import { Benefits } from "../components/landing-page/benefits";
import { CTA } from "../components/landing-page/cta";
import { DashboardPreview } from "../components/landing-page/dashboard-preview";
import { Features } from "../components/landing-page/features";
import { Hero } from "../components/landing-page/hero";
import { Problem } from "../components/landing-page/problem";
import { Solution } from "../components/landing-page/solutions";

export default function Home(): JSX.Element {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <Problem />
      <Solution />
      <Features />
      <DashboardPreview />
      <Benefits />
      <CTA />
    </main>
  );
}
