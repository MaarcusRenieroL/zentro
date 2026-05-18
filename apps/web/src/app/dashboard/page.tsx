import { JSX } from "react";

import { ActivitySection } from "~/src/components/dashboard/activity-section";
import { getDashboardContext } from "~/src/lib/dashboard-context";

export default async function DashboardPage(): Promise<JSX.Element> {
  const { organization, session } = await getDashboardContext();

  return (
    <section className="p-10">
      <ActivitySection orgName={organization.name} name={session.user.name} />
    </section>
  );
}
