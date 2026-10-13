import { JSX } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@zentro/auth";

import { paths } from "~/src/lib/paths";
import { Footer } from "../components/layout/footer";
import { Benefits } from "../components/landing-page/benefits";
import { CTA } from "../components/landing-page/cta";
import { DashboardPreview } from "../components/landing-page/dashboard-preview";
import { Features } from "../components/landing-page/features";
import { Hero } from "../components/landing-page/hero";
import { Problem } from "../components/landing-page/problem";
import { Solution } from "../components/landing-page/solutions";
import { Navbar } from "../components/layout/navbar";

export default async function Home(): Promise<JSX.Element> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect(paths.dashboard());
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <Hero />
        <Problem />
        <Solution />
        <Features />
        <DashboardPreview />
        <Benefits />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
