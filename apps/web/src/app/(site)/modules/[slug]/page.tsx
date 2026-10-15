import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JSX } from "react";

import { SitePage } from "~/src/components/site/site-page";

const modules = {
  tasks: "Tasks",
  docs: "Docs",
} as const;

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return Object.keys(modules).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const name = modules[slug as keyof typeof modules];

  return name ? { title: name } : {};
}

export default async function Page({
  params,
}: {
  params: Promise<Params>;
}): Promise<JSX.Element> {
  const { slug } = await params;

  if (!(slug in modules)) notFound();

  return <SitePage page="module" module={slug as keyof typeof modules} />;
}
