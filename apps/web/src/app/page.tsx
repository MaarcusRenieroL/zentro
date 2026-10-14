import { JSX } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@zentro/auth";

import { paths } from "~/src/lib/paths";
import { LandingFooter } from "../components/landing-page/footer";
import { Hero } from "../components/landing-page/hero";
import { LandingShell } from "../components/landing-page/landing-shell";
import {
  ModulesSection,
  ReplacesSection,
} from "../components/landing-page/modules-section";
import { PickSection } from "../components/landing-page/pick-section";
import {
  ClosingCta,
  ControlSection,
  TeamSection,
  ThreadSection,
  TodaySection,
} from "../components/landing-page/sections";

export default async function Home(): Promise<JSX.Element> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect(paths.dashboard());
  }

  return (
    <LandingShell>
      <main>
        <Hero />
        <ModulesSection />
        <ReplacesSection />
        <TodaySection />
        <TeamSection />
        <ThreadSection />
        <ControlSection />
        <PickSection />
        <ClosingCta />
      </main>
      <LandingFooter />
    </LandingShell>
  );
}
