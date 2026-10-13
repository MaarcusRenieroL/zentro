import { NotionEditorPage } from "~/src/features/docs/components/pages/doc/notion-editor-page";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function DocPage({ params }: Props) {
  const { slug } = await params;

  return <NotionEditorPage slug={slug} />;
}
