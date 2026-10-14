import { notFound } from "next/navigation";

import { Gallery } from "./gallery";

export const metadata = { title: "Components" };

// A development-only catalogue of every primitive in every state. It does not
// exist in production builds.
export default function ComponentsPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <Gallery />;
}
