import { FC } from "react";
import { Header } from "./header";
import { SearchToolbar } from "./search-toolbar";
import { RecentDocs } from "./recent-docs";
import { AllDocs } from "./all-docs";

export const HomeDashboard: FC = () => {
  return (
    <section className="flex w-full flex-col gap-7">
      <Header />
      <SearchToolbar />
      <RecentDocs />
      <AllDocs />
    </section>
  );
};
