import type { Metadata } from "next";

import { FilesLibrary } from "~/src/components/files/files-library";

export const metadata: Metadata = { title: "Files" };

export default function FilesPage() {
  return <FilesLibrary />;
}
