import { ReactNode } from "react";

import { requireModule } from "~/src/lib/dashboard-context";

export default async function DocsLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  await requireModule("docs");

  return children;
}
