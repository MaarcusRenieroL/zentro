import { HomeDashboard } from "~/src/components/home/home-dashboard";
import { getDashboardContext } from "~/src/lib/dashboard-context";

export default async function HomePage() {
  const { organization } = await getDashboardContext();

  return <HomeDashboard organizationName={organization.name} />;
}
