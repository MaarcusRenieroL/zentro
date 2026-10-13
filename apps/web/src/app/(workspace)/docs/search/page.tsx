import { SearchResultsPage } from "~/src/features/docs/components/pages/search/search-results-page";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string | string[];
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = Array.isArray(params.q)
    ? (params.q[0] ?? "")
    : (params.q ?? "");

  return <SearchResultsPage query={query} />;
}
