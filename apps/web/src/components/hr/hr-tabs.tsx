"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/hr", label: "Directory" },
  { href: "/hr/leave", label: "Time off" },
];

export function HrTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="HR sections" className="flex gap-1">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={pathname === tab.href ? "page" : undefined}
          className={`rounded-lg px-3 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            pathname === tab.href
              ? "bg-sunken font-medium text-ink"
              : "text-ink-2 hover:bg-sunken"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
