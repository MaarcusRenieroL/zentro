import { JSX } from "react";

import { ProfileSection } from "~/src/components/workspace/settings/account-sections";
import { getDashboardContext } from "~/src/lib/dashboard-context";

export const metadata = { title: "Profile" };

export default async function ProfileSectionPage(): Promise<JSX.Element> {
  const { session } = await getDashboardContext();

  return <ProfileSection name={session.user.name} email={session.user.email} />;
}
