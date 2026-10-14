import { JSX } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@zentro/auth";

import { paths } from "~/src/lib/paths";
import { LandingPage } from "../components/landing-page/landing-page";

export default async function Home(): Promise<JSX.Element> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect(paths.dashboard());
  }

  return <LandingPage />;
}
