import { paths } from "~/src/lib/paths";
import { redirect } from "next/navigation";

export default function OrganizationSettingsPage(): never {
  redirect(paths.generalSettings());
}
