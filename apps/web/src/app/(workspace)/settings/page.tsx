import { paths } from "~/src/lib/paths";
import { redirect } from "next/navigation";

export default function SettingsPage(): never {
  redirect(paths.generalSettings());
}
