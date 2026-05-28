"use client";

import { useEffect, useState } from "react";

type Props = {
  slug: string;
  checkSlug: (slug: string) => Promise<boolean>;
  delay?: number;
};

export function useSlugAvailability({ slug, checkSlug, delay = 300 }: Props) {
  const [checkedSlug, setCheckedSlug] = useState<string>("");
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  useEffect(() => {
    if (!slug) {
      setCheckedSlug("");
      setIsAvailable(null);
      setIsChecking(false);

      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      setIsChecking(true);

      try {
        const available = await checkSlug(slug);

        if (cancelled) {
          return;
        }

        setCheckedSlug(slug);
        setIsAvailable(available);
      } finally {
        if (!cancelled) {
          setIsChecking(false);
        }
      }
    }, delay);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [slug, checkSlug, delay]);

  const visibleAvailability =
    slug.length > 0 && checkedSlug === slug ? isAvailable : null;

  return {
    checkedSlug,
    isAvailable,
    isChecking,
    visibleAvailability,
  };
}
