import { StaticDocListPage } from "~/src/features/docs/components/pages/list/static-doc-list-page";

export default function MyDocsPage() {
  return (
    <StaticDocListPage
      title="My docs"
      description="Pages you own or edited recently."
      mode="my-docs"
    />
  );
}
