import { ReactNode } from "react";

import { requireModule } from "~/src/lib/dashboard-context";

export default async function TasksLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  await requireModule("tasks");

  return children;
}
