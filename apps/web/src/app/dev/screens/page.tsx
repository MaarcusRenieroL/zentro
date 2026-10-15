import { notFound } from "next/navigation";

import { Screens } from "./screens";

export const metadata = { title: "Screens" };

// A development-only catalogue of screens in states the live data cannot
// produce yet (notifications, system pages). Absent from production builds.
export default function ScreensPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <Screens />;
}
