export type AuditTargetType =
  | "organization"
  | "member"
  | "invitation"
  | "team"
  | "project"
  | "task"
  | "doc"
  | "comment"
  | "role"
  | "assignment"
  | "override"
  | "module"
  | "session"
  | "user"
  | "audit"
  | "channel"
  | "file"
  | "event"
  | "board";

/** Where an event belongs: a module id, or the platform itself. */
export type AuditModule =
  | "platform"
  | "settings"
  | "projects"
  | "tasks"
  | "docs"
  | "chat"
  | "files"
  | "calendar"
  | "whiteboards"
  | "dashboard";

export type AuditEventDefinition = {
  /** Dotted key such as `task.created`. */
  key: string;
  label: string;
  module: AuditModule;
  targetType: AuditTargetType;
  /** True for events that must not appear in resource activity feeds. */
  auditOnly: boolean;
  description: string;
  /**
   * Recorded by an authentication hook rather than by a tRPC mutation. The
   * value names the hook.
   */
  hookOnly?: string;
  /**
   * Phrase after the actor in a sentence. `{target}` is replaced with the
   * snapshot label of the target.
   */
  phrase: string;
};

export type AuditChange = {
  field: string;
  from: string | null;
  to: string | null;
};

/** The shape of a stored event, as far as the pure helpers need it. */
export type AuditEventLike = {
  action: string;
  targetType: string;
  targetLabel: string | null;
  metadata: Record<string, unknown> | null;
};
