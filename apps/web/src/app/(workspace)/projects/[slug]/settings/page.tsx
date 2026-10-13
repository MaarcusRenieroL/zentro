"use client";

import { paths } from "~/src/lib/paths";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProjectsSettingsPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(paths.projectGeneralSettings(params.slug));
  }, [params.slug, router]);

  return null;
}
