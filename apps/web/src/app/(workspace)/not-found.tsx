import { NotFoundContent } from "~/src/components/system/not-found-content";

// Shown inside the app shell when a page calls notFound().
export default function WorkspaceNotFound() {
  return <NotFoundContent inShell />;
}
