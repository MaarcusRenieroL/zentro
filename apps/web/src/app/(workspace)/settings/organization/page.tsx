import { redirect } from "next/navigation";

export default function OrganizationSettingsPage(): never {
  redirect("/settings/organization/general");
}
