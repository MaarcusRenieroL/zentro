export type DocsListItem = {
  id: string;
  title: string;
  slug: string;
  projectId: string | null;
  projectName: string | null;
  createdBy: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DocDetail = DocsListItem & {
  content: string;
  createdByMemberId: string | null;
};

export function createDocSlug(title: string) {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);

  return slug || `untitled-${Date.now()}`;
}

export function getDocTitle(title?: string | null) {
  return title?.trim() || "Untitled";
}

export function getDocProject(doc: Pick<DocsListItem, "projectName">) {
  return doc.projectName ?? "Workspace";
}

export function getDocOwner(doc: Pick<DocsListItem, "createdBy">) {
  return doc.createdBy ?? "Unknown";
}

export function getInitials(value?: string | null) {
  const words = value?.trim().split(/\s+/).filter(Boolean) ?? [];

  if (!words.length) {
    return "UN";
  }

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

export function formatDocDate(value: Date | string | null | undefined) {
  if (!value) {
    return "Unknown";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
}
