"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProjectsSettingsPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();

  useEffect(() => {
    router.replace(`/projects/${params.slug}/settings/general`);
  }, [params.slug, router]);

  return null;
}
