function parseHref(href: string) {
  const url = new URL(href, "http://zentro.local");

  return { path: url.pathname, params: url.searchParams };
}

/**
 * Picks the one link that matches the current route. A link's own query
 * parameters must all be present; more specific matches (exact path, matching
 * query) beat a plain path prefix.
 */
export function findActiveHref(
  hrefs: string[],
  pathname: string,
  searchParams: URLSearchParams,
) {
  let best: { href: string; score: number } | null = null;

  for (const href of hrefs) {
    const { path, params } = parseHref(href);
    const exact = pathname === path;
    const prefix = pathname.startsWith(`${path}/`);

    if (!exact && !prefix) {
      continue;
    }

    let queryMatches = true;

    params.forEach((value, key) => {
      if (searchParams.get(key) !== value) {
        queryMatches = false;
      }
    });

    if (!queryMatches) {
      continue;
    }

    const score = (exact ? 1000 : 0) + path.length + params.size * 10_000;

    if (!best || score > best.score) {
      best = { href, score };
    }
  }

  return best?.href ?? null;
}
