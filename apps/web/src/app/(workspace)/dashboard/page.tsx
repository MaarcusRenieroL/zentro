import { JSX } from "react";

import { ActivitySection } from "~/src/components/workspace/dashboard/activity-section";
import { OverviewSection } from "~/src/components/workspace/dashboard/overview-section";
import { getDashboardContext } from "~/src/lib/dashboard-context";

export default async function DashboardPage(): Promise<JSX.Element> {
  const { organization, session } = await getDashboardContext();

  return (
    <section className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:gap-8 xl:px-10">
      <ActivitySection orgName={organization.name} name={session.user.name} />
      <OverviewSection />
    </section>
  );
}
