import { JSX } from "react";

import { ActivitySection } from "~/src/components/workspace/dashboard/activity-section";
import { OverviewSection } from "~/src/components/workspace/dashboard/overview-section";
import { getDashboardContext } from "~/src/lib/dashboard-context";

export default async function DashboardPage(): Promise<JSX.Element> {
  const { organization, session } = await getDashboardContext();

  return (
    <section className="flex flex-col gap-8 px-4 py-8 sm:px-6 lg:px-10">
      <ActivitySection orgName={organization.name} name={session.user.name} />
      <OverviewSection />
    </section>
  );
}
