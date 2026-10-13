import { ReactNode } from "react";

import { requireModule } from "~/src/lib/dashboard-context";

export default async function ProjectsLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  await requireModule("projects");

  return children;
}
