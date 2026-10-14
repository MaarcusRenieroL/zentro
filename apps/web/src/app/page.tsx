import { JSX } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@zentro/auth";

import { paths } from "~/src/lib/paths";
import { AuditVisual } from "../components/landing-page/audit-visual";
import { Bento } from "../components/landing-page/bento";
import { FinalCta } from "../components/landing-page/cta";
import { LandingFooter } from "../components/landing-page/footer";
import { Hero } from "../components/landing-page/hero";
import { ModulesDemo } from "../components/landing-page/modules-demo";
import { LandingNav } from "../components/landing-page/nav";
import { PermissionsDemo } from "../components/landing-page/permissions-demo";
import { Roadmap } from "../components/landing-page/roadmap";

export default async function Home(): Promise<JSX.Element> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect(paths.dashboard());
  }

  return (
    <div className="min-h-screen bg-canvas">
      <LandingNav />
      <main>
        <Hero />
        <Bento />
        <PermissionsDemo />
        <ModulesDemo />
        <AuditVisual />
        <Roadmap />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
