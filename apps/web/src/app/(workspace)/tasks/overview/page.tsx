import { HomeDashboard } from "~/src/features/tasks/components/home/home-dashboard";
import { getDashboardContext } from "~/src/lib/dashboard-context";

export default async function TaskOverviewPage() {
  const { organization } = await getDashboardContext();

  return <HomeDashboard organizationName={organization.name} />;
}
