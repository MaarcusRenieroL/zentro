import { JSX } from "react";

import { ProjectAccessSection } from "~/src/components/project-detail/settings/access-section";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ProjectAccessSettingsPage({
  params,
}: Props): Promise<JSX.Element> {
  const { slug } = await params;

  return <ProjectAccessSection slug={slug} />;
}
