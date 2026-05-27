import { ProjectList } from "~/src/components/projects/list";
import { ProjectToolbar } from "~/src/components/projects/toolbar";

export default function ProjectsPage() {
  return (
    <section className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:gap-8 xl:px-10">
      <ProjectToolbar />
      <ProjectList />
    </section>
  );
}
