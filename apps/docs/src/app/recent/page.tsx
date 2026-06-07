import { StaticDocListPage } from "../../components/pages/list/static-doc-list-page";

export default function RecentPage() {
  return (
    <StaticDocListPage
      title="Recent"
      description="Recently updated pages across your workspace."
      mode="recent"
    />
  );
}
