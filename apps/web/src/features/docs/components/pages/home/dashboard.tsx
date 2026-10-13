import { FC } from "react";
import { Header } from "./header";
import { SearchToolbar } from "./search-toolbar";
import { RecentDocs } from "./recent-docs";
import { AllDocs } from "./all-docs";

export const HomeDashboard: FC = () => {
  return (
    <section className="mx-auto flex w-full max-w-400 flex-col gap-7 px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
      <Header />
      <SearchToolbar />
      <RecentDocs />
      <AllDocs />
    </section>
  );
};
