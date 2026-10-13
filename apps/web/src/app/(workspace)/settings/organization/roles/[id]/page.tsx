import { JSX } from "react";

import { RoleEditor } from "~/src/components/workspace/roles/role-editor";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function RoleSettingsPage({
  params,
}: Props): Promise<JSX.Element> {
  const { id } = await params;

  return <RoleEditor roleId={id} />;
}
